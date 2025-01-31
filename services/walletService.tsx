// services/firebaseService.ts
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
} from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'

// Define data models for wallet, including the id
export interface Wallet {
  id: string // Include the id as a property of Wallet
  userId: string
  currency: string
  frozenBalance: number
  totalDeposits: number
  totalWithdrawal: number
  transactionCount: number
  walletBalance: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Fetch all wallets
export const getAllWallets = async (): Promise<Wallet[]> => {
  const walletsCollection = collection(db, 'wallets')

  const snapshot = await getDocs(walletsCollection)
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Wallet

    // Return the data and manually add the 'id' field to avoid overwriting
    return { ...data, id: doc.id } // Add the document id to the wallet data
  })
}

// Fetch a wallet by user_id
export const getUserWalletById = async (
  userId: string
): Promise<Wallet | null> => {
  const walletsCollection = collection(db, 'wallet')
  const transactionsCollection = collection(db, 'transactions')

  const snapshot = await getDocs(walletsCollection)
  const walletDoc = snapshot.docs.find((doc) => doc.data().userId === userId)

  if (!walletDoc) return null

  const walletData = { ...walletDoc.data(), id: walletDoc.id } as Wallet

  // Fetch all withdrawal transactions for this user
  const withdrawalQuery = query(
    transactionsCollection,
    where('userId', '==', userId),
    where('transactionType', '==', 'Withdraw')
  )

  const withdrawalSnapshot = await getDocs(withdrawalQuery)
  const totalWithdrawals = withdrawalSnapshot.docs.reduce(
    (sum, doc) => sum + doc.data().amount,
    0
  )

  // Fetch all withdrawal transactions for this user
  const depositQuery = query(
    transactionsCollection,
    where('userId', '==', userId),
    where('transactionType', '==', 'Deposit')
  )

  const depositSnapshot = await getDocs(depositQuery)
  const totalDeposits = depositSnapshot.docs.reduce(
    (sum, doc) => sum + doc.data().amount,
    0
  )

  return {
    ...walletData,
    totalWithdrawal: totalWithdrawals,
    totalDeposits: totalDeposits,
  }
}

// Function to create a new wallet for a user
export const initializeWallet = async (
  userId: string,
  currency: string = 'USD'
): Promise<void> => {
  if (!userId) {
    console.error('User ID is required to create a wallet!')
    return
  }

  try {
    const walletsCollection = collection(db, 'wallet')
    const snapshot = await getDocs(walletsCollection)

    // Check if the user already has a wallet
    const existingWallet = snapshot.docs.find(
      (doc) => doc.data().userId === userId
    )
    if (existingWallet) {
      console.warn(`Wallet already exists for userId: ${userId}`)
      return
    }

    // Create new wallet object
    const newWallet = {
      userId,
      currency,
      walletBalance: 0,
      frozenBalance: 0,
      totalDeposits: 0,
      totalWithdrawal: 0,
      transactionCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    // Add new wallet to Firestore
    await addDoc(walletsCollection, newWallet)
    console.log(`New wallet created for userId: ${userId}`)
  } catch (error) {
    console.error('Error creating wallet:', error)
  }
}

// Update a wallet
export const processWalletDeposit = async (
  userId: string,
  incomingAmount: number
): Promise<void> => {
  if (!userId) {
    console.error('User ID is missing!')
    return
  }

  try {
    const walletCollection = collection(db, 'wallet')
    const snapshot = await getDocs(walletCollection)

    if (snapshot.empty) {
      console.error('No wallets found in the database.')
      return
    }

    const walletDoc = snapshot.docs.find((doc) => doc.data().userId === userId)

    if (!walletDoc) {
      console.error(`No wallet found for userId: ${userId}`)
      return
    }

    const walletDocRef = doc(db, 'wallet', walletDoc.id)
    const walletData = walletDoc.data()
    console.log('Wallet Data:', walletData)

    const currentBalance = walletData.walletBalance ?? 0
    const newBalance = currentBalance + incomingAmount

    const newTotalDeposits = (walletData.totalDeposits || 0) + incomingAmount

    await updateDoc(walletDocRef, {
      walletBalance: newBalance,
      totalDeposits: newTotalDeposits,
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
  }
}

export const processWalletWithdrawal = async (
  userId: string,
  incomingAmount: number
): Promise<void> => {
  try {
    const walletCollection = collection(db, 'wallet')

    // Fetch all documents in the wallet collection
    const snapshot = await getDocs(walletCollection)

    // Find the wallet document matching the given userId
    const walletDoc = snapshot.docs?.find((doc) => doc.data().userId === userId)

    if (!walletDoc) {
      return
    }

    // Extract the document reference and current balance
    const walletDocRef = doc(db, 'wallet', walletDoc.id)
    const walletData = walletDoc.data()
    const currentBalance = walletData.walletBalance || 0 // Default to 0 if undefined

    // Ensure balance is sufficient
    if (walletData.walletBalance < incomingAmount) {
      throw new Error('Insufficient balance!')
    }

    // Calculate the new balance
    const newBalance = currentBalance - incomingAmount
    const newTotalWithdrawals =
      (walletData.totalWithdrawal || 0) + incomingAmount

    // Update the wallet document with the new balance
    await updateDoc(walletDocRef, {
      walletBalance: newBalance,
      totalWithdrawal: newTotalWithdrawals,
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
  }
}

// Delete a wallet
export const removeWallet = async (id: string): Promise<void> => {
  const walletDoc = doc(db, 'wallets', id)
  await deleteDoc(walletDoc)
}
