"use client"

import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { RootState } from "@/lib/stores/store"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"
import { Plus } from "lucide-react"

import {
  resetAddFundsModal,
  setAddFundsType,
  toggleAddFundsModal
} from "@/lib/slices/addfunds.reducer"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "../../hooks/use-toast"

function Header() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const { toast } = useToast()

  const [firstName, setFirstName] = useState("User")
  const [lastName, setLastName] = useState("")
  const [photoURL, setPhotoURL] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const balance: number = 0

  const handleAddFunds = () => {
    dispatch(resetAddFundsModal())
    dispatch(toggleAddFundsModal())
  }
  const handleDeposit = () => handleAddFunds()
  const handleWithdrawal = () => {
    dispatch(setAddFundsType("withdraw"))
    dispatch(toggleAddFundsModal())
  }

  useEffect(() => {
    if (!user?.uid) return
    const fetchUserProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          setFirstName(data.firstName || "User")
          setLastName(data.lastName || "")
          setPhotoURL(data.photoURL || "")
        }
      } catch {
        toast({
          description: "Failed to fetch user profile.",
          variant: "destructive",
          duration: 3000
        })
      }
    }
    fetchUserProfile()
  }, [user?.uid, toast])

  const initials = (firstName[0] || "") + (lastName[0] || "")
  const userInitials = initials.toUpperCase()

  return (
    <div className="flex-col md:flex-row md:items-center gap-2 flex md:justify-between px-2 lg:px-4 py-2 bg-background/95 border-b">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {photoURL ? (
                <div
                  onClick={() => setIsDialogOpen(true)}
                  className="w-8 h-8 relative cursor-pointer rounded-full overflow-hidden"
                >
                  <Image
                    src={photoURL}
                    alt="Profile Avatar"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ) : (
                <div
                  onClick={() => setIsDialogOpen(true)}
                  className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-100 cursor-pointer"
                >
                  {userInitials || "U"}
                </div>
              )}
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Profile Picture</DialogTitle>
              </DialogHeader>
              {photoURL ? (
                <div className="flex justify-center">
                  <Image
                    src={photoURL}
                    alt="Enlarged"
                    width={500}
                    height={500}
                    className="rounded"
                  />
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p>No profile photo available.</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Typography variant="h2" className="font-semibold text-primary">
            Hi {firstName}! 👋
          </Typography>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Typography variant="p" className="font-semibold">
            Balance:
          </Typography>
          <Typography
            variant="h1"
            className="text-[1.1rem] font-bold dark:text-white"
          >
            USD {balance.toFixed(2)}
          </Typography>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button
          onClick={handleDeposit}
          variant="secondary"
          className="text-white flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Funds
        </Button>

        <Button onClick={handleWithdrawal} variant="destructive">
          Withdraw
        </Button>
      </div>
    </div>
  )
}

export default Header
