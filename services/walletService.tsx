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
export const updateWallet = async (
  id: string,
  updatedData: Partial<Wallet>
): Promise<void> => {
  const walletDoc = doc(db, 'wallets', id)
  await updateDoc(walletDoc, updatedData)
}

// Delete a wallet
export const deleteWallet = async (id: string): Promise<void> => {
  const walletDoc = doc(db, 'wallets', id)
  await deleteDoc(walletDoc)
}
