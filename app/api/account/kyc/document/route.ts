import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getKycSettings } from '@/lib/kyc-settings'
import { putS3Object, safeStorageFileName } from '@/lib/s3-upload'

const DocumentTypeSchema = z.enum(['business_license', 'identity_front', 'identity_back', 'other'])
const MAX_FILE_SIZE = 12 * 1024 * 1024

export async function POST(request: Request) {
  const user = await requireUser()
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ ok: false, error: '上传表单无效' }, { status: 400 })
  }

  const parsedType = DocumentTypeSchema.safeParse(formData.get('document_type'))
  const file = formData.get('file')
  if (!parsedType.success || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: '缺少文件或文件类型' }, { status: 400 })
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, error: '文件大小必须在 1B 到 12MB 之间' }, { status: 400 })
  }

  const settings = await getKycSettings()
  const originalName = file.name || 'document'
  const safeName = safeStorageFileName(originalName)
  const prefix = settings.s3.prefix.replace(/^\/+|\/+$/g, '')
  const key = `${prefix}/${user.id}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const uploaded = await putS3Object(settings, {
      key,
      body: buffer,
      contentType: file.type || 'application/octet-stream'
    })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('user_kyc_documents')
      .insert({
        user_id: user.id,
        document_type: parsedType.data,
        original_filename: originalName,
        storage_key: uploaded.key,
        storage_url: uploaded.url,
        mime_type: file.type || null,
        size_bytes: file.size,
        status: 'pending'
      })
      .select('id,document_type,original_filename,storage_url,status,created_at')
      .single()
    if (error) throw error

    await supabase
      .from('store_users')
      .update({
        kyc_status: 'pending',
        enterprise_certification_status: user.account_type === 'enterprise' ? 'pending' : user.enterprise_certification_status,
        identity_plan_status: user.identity_plan_status === 'active' ? 'active' : 'pending_kyc',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true, document: data })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'KYC 文件上传失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
