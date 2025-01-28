import React, { createContext, ReactNode, useState } from 'react'
import {
  fetchTransactionByUserId,
  // addTransaction, // Function to add new transaction
  updateTransaction, // Function to update an existing transaction
} from '../services/transactionService'

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
  isLoading: boolean
  fetchUserTransactionById: (userId: string) => Promise<void>
  refreshTransaction: (userId: string) => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  depositTransaction: (
    userId: string,
    amount: number,
    paymentMethod: string
  ) => Promise<void>
  withdrawTransaction: (
    userId: string,
    amount: number,
    paymentMethod: string
  ) => Promise<void>
}

export const TransactionContext = createContext<
  TransactionContextProps | undefined
>(undefined)

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Fetch the transaction by userId
  const fetchUserTransactionById = async (userId: string) => {
    setIsLoading(true)
    try {
      const transactionData = await fetchTransactionByUserId(userId)

      if (transactionData) {
        // Only set the state if transactionData is not null
        setTransaction(transactionData)
      } else {
        console.log('No transaction found for this user')
        setTransaction(null) // Optionally set the state to null if no transaction is found
      }
    } catch (error) {
      console.error('Failed to fetch transaction data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh the transaction data
  const refreshTransaction = async (userId: string) => {
    await fetchUserTransactionById(userId)
  }

  // Update a transaction's data
  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      await updateTransaction(id, data)
      await fetchUserTransactionById(data.userId || '')
    } catch (error) {
      console.error('Failed to update transaction data:', error)
    }
  }

  // Handle deposit transaction
  const depositTransaction = async (
    userId: string,
    amount: number,
    paymentMethod: string
  ) => {
    setIsLoading(true)
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        amount,
        createdAt: new Date(),
        paymentMethod,
        transactionDetails: new Map(),
        reference: `ref-${Math.random().toString(36).substr(2, 9)}`, // Generate a random reference
        transactionFee: 0, // You can calculate fees as needed
        transactionStatus: 'Completed',
        transactionType: 'Deposit',
        updatedAt: new Date(),
        userId,
      }

      // Add deposit transaction
      // await addTransaction(newTransaction)
      await fetchUserTransactionById(userId) // Refresh transaction after deposit
    } catch (error) {
      console.error('Failed to process deposit transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle withdrawal transaction
  const withdrawTransaction = async (
    userId: string,
    amount: number,
    paymentMethod: string
  ) => {
    setIsLoading(true)
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        amount: -amount, // For withdrawals, the amount will be negative
        createdAt: new Date(),
        paymentMethod,
        transactionDetails: new Map(),
        reference: `ref-${Math.random().toString(36).substr(2, 9)}`, // Generate a random reference
        transactionFee: 0, // You can calculate fees as needed
        transactionStatus: 'Completed',
        transactionType: 'Withdrawal',
        updatedAt: new Date(),
        userId,
      }

      // Add withdrawal transaction
      // await addTransaction(newTransaction)
      await fetchUserTransactionById(userId) // Refresh transaction after withdrawal
    } catch (error) {
      console.error('Failed to process withdrawal transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TransactionContext.Provider
      value={{
        transaction,
        isLoading,
        fetchUserTransactionById,
        refreshTransaction,
        updateTransaction,
        depositTransaction,
        withdrawTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}
