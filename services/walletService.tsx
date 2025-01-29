// services/firebaseService.ts
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
export const fetchWallets = async (): Promise<Wallet[]> => {
  const walletsCollection = collection(db, 'wallets')

  const snapshot = await getDocs(walletsCollection)
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Wallet
    console.log(data)

    // Return the data and manually add the 'id' field to avoid overwriting
    return { ...data, id: doc.id } // Add the document id to the wallet data
  })
}

// Fetch a wallet by user_id
export const fetchWalletByUserId = async (
  userId: string
): Promise<Wallet | null> => {
  const walletsCollection = collection(db, 'wallet')

  const snapshot = await getDocs(walletsCollection)

  const walletDoc = snapshot.docs.find((doc) => doc.data().userId === userId)

  return walletDoc
    ? ({ ...walletDoc.data(), id: walletDoc.id } as Wallet)
    : null
}

// Add a wallet
export const addWallet = async (
  walletData: Omit<Wallet, 'id'>
): Promise<void> => {
  const walletsCollection = collection(db, 'wallets')
  await addDoc(walletsCollection, walletData)
}

// Update a wallet
export const updateWalletDeposit = async (
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
    // Calculate the new balance
    const newBalance = currentBalance + incomingAmount

    // Update the wallet document with the new balance
    await updateDoc(walletDocRef, { walletBalance: newBalance })
  } catch (error) {
    console.error('Error updating wallet:', error)
  }
}

export const updateWalletWithdrawal = async (
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
    // Calculate the new balance
    const newBalance = currentBalance - incomingAmount

    // Update the wallet document with the new balance
    await updateDoc(walletDocRef, { walletBalance: newBalance })
  } catch (error) {
    console.error('Error updating wallet:', error)
  }
}

// Delete a wallet
export const deleteWallet = async (id: string): Promise<void> => {
  const walletDoc = doc(db, 'wallets', id)
  await deleteDoc(walletDoc)
}
