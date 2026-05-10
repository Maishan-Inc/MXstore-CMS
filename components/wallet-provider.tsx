'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  baseAccount,
  binanceWallet,
  injectedWallet,
  okxWallet,
  rainbowWallet,
  tokenPocketWallet,
  trustWallet,
  walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider } from 'wagmi'
import { mainnet, base, bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'replace-me'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
const appIcon = `${appUrl.replace(/\/$/, '')}/wallet-app-icon.svg`

const config = getDefaultConfig({
  appName: 'MXStore',
  appDescription: 'MXStore 应用商店 CMS 与签名下载系统',
  appUrl,
  appIcon,
  projectId,
  wallets: [
    {
      groupName: 'MXStore 登录',
      wallets: [
        rainbowWallet,
        baseAccount,
        injectedWallet,
        okxWallet,
        trustWallet,
        tokenPocketWallet,
        binanceWallet,
        walletConnectWallet
      ]
    }
  ],
  chains: [mainnet, base, bsc],
  ssr: true
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{
            appName: 'MXStore',
            learnMoreUrl: appUrl
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
