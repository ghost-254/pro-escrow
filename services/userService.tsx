// services/firebaseService.ts
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebaseConfig'

// Define data models
export interface User {
  id: string
  name: string
  email: string
}

// Fetch all users
export const fetchUsers = async (): Promise<User[]> => {
  const usersCollection = collection(db, 'users')
  const snapshot = await getDocs(usersCollection)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
}

// Add a user
export const addUser = async (userData: Omit<User, 'id'>): Promise<void> => {
  const usersCollection = collection(db, 'users')
  await addDoc(usersCollection, userData)
}

// Update a user
export const updateUser = async (
  id: string,
  updatedData: Partial<User>
): Promise<void> => {
  const userDoc = doc(db, 'users', id)
  await updateDoc(userDoc, updatedData)
}

// Delete a user
export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id)
  await deleteDoc(userDoc)
}

// Authentication
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const logoutUser = async (): Promise<void> => {
  await signOut(auth)
}
//
