import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  orderBy,
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
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const transactionsCollection = collection(db, 'transactions')

  const snapshot = await getDocs(transactionsCollection)
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Transaction
    return { ...data, id: doc.id } // Add the document id to the transaction data
  })
}

// Fetch a transaction by userId ||Single
export const getUserLatestTransaction = async (
  userId: string
): Promise<Transaction | null> => {
  const transactionsCollection = collection(db, 'transactions')

  const snapshot = await getDocs(transactionsCollection)

  const transactionDoc = snapshot.docs.find(
    (doc) => doc.data().userId === userId
  )

  return transactionDoc
    ? ({
        ...transactionDoc.data(),
        id: transactionDoc.id,
      } as unknown as Transaction)
    : null
}

// fetch All transactions that matches userId
export const getUserTransactions = async (
  userId: string
): Promise<Transaction[]> => {
  const transactionsCollection = collection(db, 'transactions')

  // Create a query to fetch transactions where userId matches
  const q = query(
    transactionsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  // Get the documents that match the query
  const snapshot = await getDocs(q)

  // Map the documents to an array of transactions
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Transaction
    return { ...data, id: doc.id } // Add the document id to each transaction
  })
}

// Fetch transactions that match userId and other conditions ||ALL + FILTERS
export const getUserTransactionsByFilter = async (filters: {
  searchTerm: string
  userId: string
  transactionType?: string
  status?: string
}): Promise<Transaction[]> => {
  const { searchTerm, userId, transactionType, status } = filters // Destructure the filters object
  console.log(searchTerm, userId, transactionType, status)

  const transactionsCollection = collection(db, 'transactions')

  // Create an array to hold the conditions
  const conditions = [where('userId', '==', userId)]

  if (searchTerm) {
    conditions.push(where('reference', '==', searchTerm))
  }

  if (transactionType && transactionType !== 'All') {
    conditions.push(where('transactionType', '==', transactionType))
  }

  if (status && status !== 'All') {
    conditions.push(where('transactionStatus', '==', status))
  }

  // Create the query with the dynamically added conditions and sort by timestamp
  const q = query(
    transactionsCollection,
    ...conditions,
    orderBy('createdAt', 'desc') // Sort by createdAt in descending order (newest first)
  )

  // Get the matching documents
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Transaction
    return { ...data, id: doc.id } // Add the document id to the transaction data
  })
}

// Deposit a transaction
export const recordDepositTransaction = async (
  transactionData: Omit<Transaction, 'id'>
): Promise<void> => {
  const transactionsCollection = collection(db, 'transactions')

  // Convert transactionDetails from Map to Object
  const transactionDetailsObj = Object.fromEntries(
    transactionData?.transactionDetails
  )

  // Create a transaction object with 'Deposit' as transactionType
  const transaction = {
    ...transactionData,
    transactionDetails: transactionDetailsObj, // Save as plain object
    transactionType: 'Deposit', // Mark the transaction as a deposit
    createdAt: Timestamp.fromDate(new Date()), // Set created timestamp
    updatedAt: Timestamp.fromDate(new Date()), // Set updated timestamp
  }

  await addDoc(transactionsCollection, transaction)
}

// Withdraw a transaction
export const recordWithdrawalTransaction = async (
  transactionData: Omit<Transaction, 'id'>
): Promise<void> => {
  const transactionsCollection = collection(db, 'transactions')

  // Convert transactionDetails from Map to Object
  const transactionDetailsObj = Object.fromEntries(
    transactionData?.transactionDetails
  )

  // Create a transaction object with 'Withdrawal' as transactionType
  const transaction = {
    ...transactionData,
    transactionDetails: transactionDetailsObj, // Save as plain object
    transactionType: 'Withdraw', // Mark the transaction as a withdrawal
    createdAt: Timestamp.fromDate(new Date()), // Set created timestamp
    updatedAt: Timestamp.fromDate(new Date()), // Set updated timestamp
  }

  await addDoc(transactionsCollection, transaction) // Save the withdrawal transaction
}

// Update a transaction
export const modifyTransactionRecord = async (
  id: string,
  updatedData: Partial<Transaction>
): Promise<void> => {
  const transactionDoc = doc(db, 'transactions', id)
  await updateDoc(transactionDoc, updatedData)
}

// Delete a transaction
export const removeTransactionRecord = async (id: string): Promise<void> => {
  const transactionDoc = doc(db, 'transactions', id)
  await deleteDoc(transactionDoc)
}
