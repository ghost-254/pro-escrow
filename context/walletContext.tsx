import React, { createContext, ReactNode, useState } from 'react'
import { fetchWalletByUserId } from '../services/walletService'
interface Wallet {
  createdAt: Date
  currency: string
  frozenBalance: number
  totalDeposits: number
  totalWithdrawal: number
  transactionCount: number
  updatedAt: Date
  userId: string
  walletBalance: number
}

interface WalletContextProps {
  wallet: Wallet | null
  isLoading: boolean
  fetchUserWalletById: (userId: string) => Promise<void>
  refreshWallet: (userId: string) => Promise<void>
  updateWallet: (userId: string, data: Partial<Wallet>) => Promise<void>
}

export const WalletContext = createContext<WalletContextProps | undefined>(
  undefined
)

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Rename the function to avoid conflict
  const fetchUserWalletById = async (userId: string) => {
    setIsLoading(true)
    try {
      const walletData = await fetchWalletByUserId(userId) // Call the service function

      setWallet(walletData as unknown as Wallet)
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshWallet = async (userId: string) => {
    await fetchUserWalletById(userId)
  }

  const updateWallet = async (userId: string, data: Partial<Wallet>) => {
    try {
      await updateWallet(userId, data)
      await fetchWalletByUserId(userId) // Refresh wallet after update
    } catch (error) {
      console.error('Failed to update wallet data:', error)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isLoading,
        fetchUserWalletById,
        refreshWallet,
        updateWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
