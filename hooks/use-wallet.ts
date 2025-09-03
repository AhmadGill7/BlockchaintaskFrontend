"use client"

import { useState, useEffect, useCallback } from "react"
import { WalletService, type WalletState } from "@/lib/wallet"

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const walletService = WalletService.getInstance()

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const state = await walletService.connectWallet()
      setWalletState(state)
    } catch (error: any) {
      setError(error.message)
      console.error("Wallet connection error:", error)
    } finally {
      setIsConnecting(false)
    }
  }, [walletService])

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
    })
    setError(null)
  }, [])

  const refreshBalance = useCallback(async () => {
    if (walletState.address) {
      try {
        const balance = await walletService.getBalance(walletState.address)
        setWalletState((prev) => ({ ...prev, balance }))
      } catch (error) {
        console.error("Error refreshing balance:", error)
      }
    }
  }, [walletState.address, walletService])

  const sendTransaction = useCallback(
    async (to: string, value: string) => {
      setError(null)
      try {
        const txHash = await walletService.sendTransaction(to, value)
        // Refresh balance after transaction
        setTimeout(refreshBalance, 2000)
        return txHash
      } catch (error: any) {
        setError(error.message)
        throw error
      }
    },
    [walletService, refreshBalance],
  )

  useEffect(() => {
    // Check if already connected on mount
    const checkConnection = async () => {
      if (await walletService.isMetaMaskInstalled()) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          })

          if (accounts.length > 0) {
            const balance = await walletService.getBalance(accounts[0])
            const chainId = await walletService.getChainId()

            setWalletState({
              address: accounts[0],
              balance,
              chainId,
              isConnected: true,
            })
          }
        } catch (error) {
          console.error("Error checking existing connection:", error)
        }
      }
    }

    checkConnection()

    // Set up event listeners
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else {
        setWalletState((prev) => ({ ...prev, address: accounts[0] }))
        refreshBalance()
      }
    }

    const handleChainChanged = (chainId: string) => {
      const newChainId = Number.parseInt(chainId, 16)
      setWalletState((prev) => ({ ...prev, chainId: newChainId }))
    }

    walletService.onAccountsChanged(handleAccountsChanged)
    walletService.onChainChanged(handleChainChanged)

    return () => {
      walletService.removeAllListeners()
    }
  }, [walletService, disconnectWallet, refreshBalance])

  return {
    walletState,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    clearError: () => setError(null),
  }
}
