import 'server-only'
import { createPublicClient, http, parseAbiItem, type Hash, type Address } from 'viem'
import { mainnet, base, bsc } from 'viem/chains'

const chainById = {
  1: mainnet,
  8453: base,
  56: bsc
} as const

export function publicClientForChain(chainId: number) {
  const rpc = process.env[`EVM_RPC_URL_${chainId}`]
  if (!rpc) throw new Error(`Missing EVM_RPC_URL_${chainId}`)
  const chain = chainById[chainId as keyof typeof chainById]
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`)
  return createPublicClient({ chain, transport: http(rpc) })
}

export async function verifyNativeTransfer(args: {
  chainId: number
  txHash: string
  payToAddress: string
  minAmountRaw: string
  expectedFrom?: string | null
}) {
  const client = publicClientForChain(args.chainId)
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash: args.txHash as Hash }),
    client.getTransactionReceipt({ hash: args.txHash as Hash })
  ])
  if (receipt.status !== 'success') return { ok: false, reason: '交易失败' }
  if (tx.to?.toLowerCase() !== args.payToAddress.toLowerCase()) return { ok: false, reason: '收款地址不匹配' }
  if (args.expectedFrom && tx.from.toLowerCase() !== args.expectedFrom.toLowerCase()) return { ok: false, reason: '付款钱包不匹配' }
  if (tx.value < BigInt(args.minAmountRaw)) return { ok: false, reason: '付款金额不足' }
  return { ok: true, blockNumber: receipt.blockNumber.toString(), from: tx.from }
}

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

export async function verifyErc20Transfer(args: {
  chainId: number
  txHash: string
  tokenContract: string
  payToAddress: string
  minAmountRaw: string
  expectedFrom?: string | null
}) {
  const client = publicClientForChain(args.chainId)
  const receipt = await client.getTransactionReceipt({ hash: args.txHash as Hash })
  if (receipt.status !== 'success') return { ok: false, reason: '交易失败' }
  const logs = await client.getLogs({
    address: args.tokenContract as Address,
    event: transferEvent,
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber
  })
  const matched = logs.find((log) => {
    if (log.transactionHash.toLowerCase() !== args.txHash.toLowerCase()) return false
    const to = log.args.to?.toLowerCase()
    const from = log.args.from?.toLowerCase()
    const value = log.args.value ?? 0n
    return (
      to === args.payToAddress.toLowerCase() &&
      (!args.expectedFrom || from === args.expectedFrom.toLowerCase()) &&
      value >= BigInt(args.minAmountRaw)
    )
  })
  if (!matched) return { ok: false, reason: '未找到匹配的 ERC20 Transfer 事件' }
  return { ok: true, blockNumber: receipt.blockNumber.toString(), from: matched.args.from }
}
