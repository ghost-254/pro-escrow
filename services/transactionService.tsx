import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

interface Transaction {
  amount: number // The amount of the transaction (e.g., 76)
  createdAt: Date // The timestamp when the transaction was created (e.g., January 28, 2025 at 11:45:08 AM UTC+3)
  paymentMethod: string // The payment method used (e.g., "Mpesa")
  transactionDetails: Map<string, string | number> // A map to hold various transaction details, such as additional metadata
  reference: string // The reference for the transaction (e.g., "0742845204")
  transactionFee: number // The fee applied to the transaction (e.g., 4)
  transactionStatus: string // The current status of the transaction (e.g., "Pending")
  transactionType: string // The type of transaction (e.g., "Deposit")
  updatedAt: Date // The timestamp when the transaction was last updated (e.g., January 14, 2025 at 11:46:35 PM UTC+3)
  userId: string // The user ID associated with the transaction (e.g., "TPWGczqmSIg9e6GJTAim3Rx0HoY2")
}

// Fetch all transactions
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const transactionsCollection = collection(db, 'transactions')

  const snapshot = await getDocs(transactionsCollection)
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Transaction
    return { ...data, id: doc.id } // Add the document id to the transaction data
  })
}

// Fetch a transaction by userId
export const fetchTransactionByUserId = async (
  userId: string
): Promise<Transaction | null> => {
  const transactionsCollection = collection(db, 'transactions')

  const snapshot = await getDocs(transactionsCollection)

  const transactionDoc = snapshot.docs.find(
    (doc) => doc.data().userId === userId
  )

  return transactionDoc
    ? ({ ...transactionDoc.data(), id: transactionDoc.id } as unknown as Transaction)
    : null
}

// Deposit a transaction
export const depositTransaction = async (
  transactionData: Omit<Transaction, 'id'>
): Promise<void> => {
  const transactionsCollection = collection(db, 'transactions')

  // Create a transaction object with 'Deposit' as transactionType
  const transaction = {
    ...transactionData,
    transactionType: 'Deposit', // Mark the transaction as a deposit
    createdAt: Timestamp.fromDate(new Date()), // Set created timestamp
    updatedAt: Timestamp.fromDate(new Date()), // Set updated timestamp
  }

  await addDoc(transactionsCollection, transaction)
}

// Withdraw a transaction
export const withdrawalTransaction = async (
  transactionData: Omit<Transaction, 'id'>
): Promise<void> => {
  const transactionsCollection = collection(db, 'transactions')

  // Create a transaction object with 'Withdrawal' as transactionType
  const transaction = {
    ...transactionData,
    transactionType: 'Withdrawal', // Mark the transaction as a withdrawal
    createdAt: Timestamp.fromDate(new Date()), // Set created timestamp
    updatedAt: Timestamp.fromDate(new Date()), // Set updated timestamp
  }

  await addDoc(transactionsCollection, transaction)
}

// Update a transaction
export const updateTransaction = async (
  id: string,
  updatedData: Partial<Transaction>
): Promise<void> => {
  const transactionDoc = doc(db, 'transactions', id)
  await updateDoc(transactionDoc, updatedData)
}

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<void> => {
  const transactionDoc = doc(db, 'transactions', id)
  await deleteDoc(transactionDoc)
}
