import React, { createContext, ReactNode, useState } from 'react'
import { initializeWallet, getUserWalletById } from '../services/walletService'
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
  getUserWallet: (userId: string) => Promise<void>
  refreshUserWallet: (userId: string) => Promise<void>
  modifyUserWallet: (userId: string, data: Partial<Wallet>) => Promise<void>
  initializeUserWallet: (userId: string) => Promise<void> // Add this line
}

export const WalletContext = createContext<WalletContextProps | undefined>(
  undefined
)

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const initializeUserWallet = async (userId: string) => {
    try {
      await initializeWallet(userId)
    } catch (error) {
      console.error('Failed to create wallet:', error)
    }
  }

  // Rename the function to avoid conflict
  const getUserWallet = async (userId: string) => {
    setIsLoading(true)
    try {
      const walletData = await getUserWalletById(userId) // Call the service function

      setWallet(walletData as unknown as Wallet)
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUserWallet = async (userId: string) => {
    await getUserWallet(userId)
  }

  const modifyUserWallet = async (userId: string, data: Partial<Wallet>) => {
    try {
      await modifyUserWallet(userId, data)
    } catch (error) {
      console.error('Failed to update wallet data:', error)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isLoading,
        getUserWallet,
        refreshUserWallet,
        modifyUserWallet,
        initializeUserWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
