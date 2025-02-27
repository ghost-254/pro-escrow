// components/AuthProvider.tsx
"use client"

import React, { useEffect } from "react"
import { useDispatch } from "react-redux"
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth"
import { auth } from "@/lib/firebaseConfig"
import { setUser } from "@/lib/slices/authSlice"

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check token expiration
        const tokenResult = await getIdTokenResult(firebaseUser)
        const expirationTime = new Date(tokenResult.expirationTime).getTime()
        const currentTime = Date.now()

        if (expirationTime - currentTime < 0) {
          // Token expired, sign out the user
          await auth.signOut()
          dispatch(setUser(null))
        } else {
          // Token is valid, map Firebase User to SerializableUser
          const serializableUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            userUsdBalance: 0, // Default value
            userKesBalance: 0, // Default value
            frozenUserUsdBalance: 0, // Default value
            frozenUserKesBalance: 0, // Default value
          }
          dispatch(setUser(serializableUser))
        }
      } else {
        // User is signed out
        dispatch(setUser(null))
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  return <>{children}</>
}

export default AuthProvider