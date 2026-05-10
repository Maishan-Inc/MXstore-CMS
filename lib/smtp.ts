import 'server-only'
import net from 'node:net'
import tls from 'node:tls'
import { getEmailSettings, getSmtpPassword, renderEmailTemplate, type EmailSettings, type EmailTemplateKey } from '@/lib/email-settings'

type SmtpSocket = net.Socket | tls.TLSSocket

export type SendMailInput = {
  to: string
  subject: string
  body: string
}

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function formatMailbox(name: string, email: string) {
  return name ? `${encodeHeader(name)} <${email}>` : email
}

function readResponse(socket: SmtpSocket) {
  return new Promise<{ code: number; text: string }>((resolve, reject) => {
    let buffer = ''
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const lastLine = lines.at(-1)
      if (!lastLine || !/^\d{3} /.test(lastLine)) return
      cleanup()
      resolve({ code: Number(lastLine.slice(0, 3)), text: buffer.trim() })
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }
    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function expect(socket: SmtpSocket, allowed: number[]) {
  const response = await readResponse(socket)
  if (!allowed.includes(response.code)) {
    throw new Error(`SMTP 返回异常 ${response.code}: ${response.text}`)
  }
  return response
}

async function command(socket: SmtpSocket, line: string, allowed: number[]) {
  socket.write(`${line}\r\n`)
  return expect(socket, allowed)
}

function connect(settings: EmailSettings) {
  return new Promise<SmtpSocket>((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    const socket = settings.secure
      ? tls.connect(settings.port, settings.host, { servername: settings.host }, () => {
          socket.off('error', onError)
          resolve(socket)
        })
      : net.connect(settings.port, settings.host, () => {
          socket.off('error', onError)
          resolve(socket)
        })
    socket.once('error', onError)
  })
}

function upgradeToTls(socket: SmtpSocket, settings: EmailSettings) {
  return new Promise<SmtpSocket>((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: settings.host }, () => resolve(secureSocket))
    secureSocket.once('error', reject)
  })
}

function escapeData(body: string) {
  return body.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

export async function sendSmtpMail(settings: EmailSettings, input: SendMailInput) {
  if (!settings.enabled) throw new Error('邮件系统未启用')
  if (!settings.host || !settings.fromEmail) throw new Error('SMTP 主机和发件邮箱未配置')

  let socket = await connect(settings)
  try {
    await expect(socket, [220])
    await command(socket, `EHLO ${settings.host}`, [250])

    if (!settings.secure && settings.startTls) {
      await command(socket, 'STARTTLS', [220])
      socket = await upgradeToTls(socket, settings)
      await command(socket, `EHLO ${settings.host}`, [250])
    }

    const password = getSmtpPassword(settings)
    if (settings.username && password) {
      const authPayload = Buffer.from(`\u0000${settings.username}\u0000${password}`, 'utf8').toString('base64')
      await command(socket, `AUTH PLAIN ${authPayload}`, [235])
    }

    await command(socket, `MAIL FROM:<${settings.fromEmail}>`, [250])
    await command(socket, `RCPT TO:<${input.to}>`, [250, 251])
    await command(socket, 'DATA', [354])

    const message = [
      `From: ${formatMailbox(settings.fromName, settings.fromEmail)}`,
      `To: <${input.to}>`,
      `Subject: ${encodeHeader(input.subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      escapeData(input.body)
    ].join('\r\n')
    socket.write(`${message}\r\n.\r\n`)
    await expect(socket, [250])
    await command(socket, 'QUIT', [221])
  } finally {
    socket.end()
  }
}

export async function sendConfiguredEmail(templateKey: EmailTemplateKey, to: string, variables: Record<string, string | number | null | undefined>) {
  const settings = await getEmailSettings()
  const rendered = renderEmailTemplate(settings.templates[templateKey], variables)
  await sendSmtpMail(settings, { to, subject: rendered.subject, body: rendered.body })
}
