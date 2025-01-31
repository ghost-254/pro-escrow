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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check token expiration
        const tokenResult = await getIdTokenResult(user)
        const expirationTime = new Date(tokenResult.expirationTime).getTime()
        const currentTime = Date.now()

        if (expirationTime - currentTime < 0) {
          // Token expired, sign out the user
          await auth.signOut()
          dispatch(setUser(null))
        } else {
          // Token is valid, set the user
          dispatch(setUser(user))
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