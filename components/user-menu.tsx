"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getAuth, signOut } from "firebase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "../hooks/use-toast"
import { db } from "@/lib/firebaseConfig"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"

export function UserMenu() {
  const router = useRouter()
  const auth = getAuth()
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const userFromRedux = useSelector((state: RootState) => state.auth.user)
  const [firstName, setFirstName] = useState("User")
  const [lastName, setLastName] = useState("")
  const [photoURL, setPhotoURL] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userFromRedux?.uid) return
      try {
        const docRef = doc(db, "users", userFromRedux.uid)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          setFirstName(data.firstName || "User")
          setLastName(data.lastName || "")
          setPhotoURL(data.photoURL || "")
        }
      } catch {
        toast.toast({
          title: "Error",
          description: "Failed to fetch user profile.",
          variant: "destructive",
        })
      }
    }
    fetchUserData()
  }, [userFromRedux?.uid, toast])

  const initials = (firstName[0] || "") + (lastName[0] || "")
  const userInitials = initials.toUpperCase() || "U"

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut(auth)
      toast.toast({
        title: "Success",
        description: "You have successfully signed out.",
        variant: "default",
      })
      router.push("/auth")
      router.refresh()
    } catch {
      toast.toast({
        title: "Error",
        description: "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {photoURL ? (
            <Image
              src={photoURL}
              alt="User avatar"
              width={120}
              height={120}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-100">
              {userInitials}
            </div>
          )}
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isLoading}>
          {isLoading ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
