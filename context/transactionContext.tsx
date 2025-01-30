import React, { createContext, ReactNode, useState } from 'react'
import {
  getUserLatestTransaction,
  recordDepositTransaction,
  recordWithdrawalTransaction,
  getUserTransactionsByFilter,
  getUserTransactions, // Import the function
} from '../services/transactionService'
import {
  processWalletDeposit,
  processWalletWithdrawal,
} from 'services/walletService'

interface Transaction {
  amount: number
  createdAt: Date
  paymentMethod: string
  transactionDetails: Map<string, string | number>
  reference: string
  transactionFee: number
  transactionStatus: string
  transactionType: string
  updatedAt: Date
  userId: string
  id?: string
}

interface TransactionContextProps {
  transaction: Transaction | null
  transactions: Transaction[] // New state to store multiple transactions
  isLoading: boolean
  isTransacting: boolean
  getUserTransactionById: (userId: string) => Promise<void>
  refreshUserTransactions: (userId: string) => Promise<void>
  modifyTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  processDepositTransaction: (
    userId: string,
    amount: number,
    transactionDetails: { paymentMethod: string; paymentDetails: string }
  ) => Promise<void>
  processWithdrawalTransaction: (
    userId: string,
    amount: number,
    transactionDetails: { paymentMethod: string; paymentDetails: string }
  ) => Promise<void>
  getUserTransactionsByFilter: (
    searchTerm: string,
    userId: string,
    transactionType: string,
    transactionStatus: string
  ) => Promise<void> // Modify the function to not return an array directly
}

export const TransactionContext = createContext<
  TransactionContextProps | undefined
>(undefined)

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([]) // New state for transactions
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isTransacting, setIsTransacting] = useState<boolean>(false)

  // Fetch the transaction by userId
  const getUserTransactionById = async (userId: string) => {
    setIsLoading(true)
    try {
      const transactionData = await getUserLatestTransaction(userId)

      if (transactionData) {
        setTransaction(transactionData)
      } else {
        console.log('No transaction found for this user')
        setTransaction(null)
      }
    } catch (error) {
      console.error('Failed to fetch transaction data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch transactions by userId and conditions (new function)
  const fetchTransactions = async (
    searchTerm: string,
    userId: string,
    transactionType: string,
    transactionStatus: string
  ) => {
    setIsLoading(true)
    try {
      // Pass an object with userId, transactionType, and transactionStatus
      const fetchedTransactions = await getUserTransactionsByFilter({
        searchTerm,
        userId,
        transactionType,
        status: transactionStatus, // Pass transactionStatus as status
      })
      setTransactions(fetchedTransactions) // Store the fetched transactions in state
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh the transaction data
  const refreshUserTransactions = async (userId: string) => {
    setIsLoading(true)
    try {
      const fetchedTransactions = await getUserTransactions(userId) // Fetch all transactions
      setTransactions(fetchedTransactions) // Store in state
    } catch (error) {
      console.error('Failed to fetch user transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update a transaction's data
  const modifyTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      await modifyTransaction(id, data)
      await getUserLatestTransaction(data.userId || '')
    } catch (error) {
      console.error('Failed to update transaction data:', error)
    }
  }

  // Handle deposit transaction
  const processDepositTransaction = async (
    userId: string,
    amount: number,
    transactionDetails: { paymentMethod: string; paymentDetails: string }
  ) => {
    setIsTransacting(true)
    try {
      const transactionData: Omit<Transaction, 'id'> = {
        amount,
        createdAt: new Date(),
        transactionDetails: new Map(Object.entries(transactionDetails)),
        reference: `ref-${Math.random().toString(36).substr(2, 9)}`,
        transactionFee: 0,
        transactionStatus: 'Completed',
        transactionType: 'Deposit',
        updatedAt: new Date(),
        userId,
        paymentMethod: transactionDetails.paymentMethod,
      }

      await recordDepositTransaction(transactionData)

      await processWalletDeposit(userId, transactionData.amount)
    } catch (error) {
      console.error('Failed to process deposit transaction:', error)
    } finally {
      setIsTransacting(false)
    }
  }

  // Handle withdrawal transaction
  const processWithdrawalTransaction = async (
    userId: string,
    amount: number,
    transactionDetails: { paymentMethod: string; paymentDetails: string }
  ) => {
    setIsTransacting(true)
    try {
      const transactionData: Omit<Transaction, 'id'> = {
        amount: amount,
        createdAt: new Date(),
        transactionDetails: new Map(Object.entries(transactionDetails)),
        reference: `ref-${Math.random().toString(36).substr(2, 9)}`,
        transactionFee: 0,
        transactionStatus: 'Completed',
        transactionType: 'Withdraw',
        updatedAt: new Date(),
        userId,
        paymentMethod: transactionDetails.paymentMethod,
      }

      await recordWithdrawalTransaction(transactionData)
      await processWalletWithdrawal(userId, transactionData.amount)
    } catch (error) {
      console.error('Failed to process withdrawal transaction:', error)
    } finally {
      setIsTransacting(false)
    }
  }

  return (
    <TransactionContext.Provider
      value={{
        transaction,
        transactions, // Provide the transactions array to the context
        isLoading,
        getUserTransactionById,
        refreshUserTransactions,
        modifyTransaction,
        processDepositTransaction,
        processWithdrawalTransaction,
        isTransacting,
        getUserTransactionsByFilter: fetchTransactions, // Provide the modified function
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
