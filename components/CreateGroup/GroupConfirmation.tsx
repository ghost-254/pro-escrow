// components/CreateGroup/GroupConfirmation.tsx

/* eslint-disable */

import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"
import { toast } from "react-toastify"
import { db } from "@/lib/firebaseConfig"
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { useRouter } from "next/navigation"
import { previousStep } from "@/lib/slices/groupCreationSlice"

const GroupConfirmation = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const {
    transactionType,
    price,
    escrowFee,
    currency,
    itemDescription,
    escrowFeeResponsibility,
  } = useSelector((state: RootState) => state.groupCreation)

  // Local state for processing, dialog and confirmation
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generatedGroupLink, setGeneratedGroupLink] = useState("")
  const [groupId, setGroupId] = useState("")
  const [isLinkCopiedConfirmed, setIsLinkCopiedConfirmed] = useState(false)
  const [copyStatus, setCopyStatus] = useState("")

  if (!user) {
    return (
      <Typography variant="h3" className="text-red-500">
        Please log in to create or join a group.
      </Typography>
    )
  }

  // Extract balances from the user object (fallback to 0)
  const userKesBalance = user.userKesBalance ?? 0
  const userUsdBalance = user.userUsdBalance ?? 0

  const handleCreateGroup = async () => {
    if (!user) {
      toast.error("Please log in first.")
      return
    }
    setIsProcessing(true)
    try {
      // Deduct funds from wallet and freeze the deducted amount
      const userRef = doc(db, "users", user.uid)
      if (currency === "USD") {
        const newUsdBalance = userUsdBalance - price
        // Use the existing frozen balance if available, otherwise 0
        const existingFrozenUsd = (user.frozenUserUsdBalance ?? 0)
        const newFrozenUsd = existingFrozenUsd + price
        await updateDoc(userRef, {
          userUsdBalance: newUsdBalance < 0 ? 0 : newUsdBalance,
          frozenUserUsdBalance: newFrozenUsd,
        })
      } else {
        const newKesBalance = userKesBalance - price
        const existingFrozenKes = (user.frozenUserKesBalance ?? 0)
        const newFrozenKes = existingFrozenKes + price
        await updateDoc(userRef, {
          userKesBalance: newKesBalance < 0 ? 0 : newKesBalance,
          frozenUserKesBalance: newFrozenKes,
        })
      }

      // Create group document
      const groupData = {
        transactionType,
        price,
        escrowFee,
        currency,
        itemDescription,
        escrowFeeResponsibility,
        participants: [user.uid],
        status: "active",
        createdAt: Timestamp.now(),
      }
      const groupRef = await addDoc(collection(db, "groups"), groupData)
      const createdGroupId = groupRef.id
      setGroupId(createdGroupId)

      // Generate full group URL using current origin
      const fullGroupUrl = `${window.location.origin}/group-chat/${createdGroupId}`
      setGeneratedGroupLink(fullGroupUrl)

      // Create notification with full URL for sharing
      const shortGroupName = `Xcrow_${createdGroupId.slice(0, 4)}`
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `New ${shortGroupName} group created for ${itemDescription}. Share this link with your seller: ${fullGroupUrl}`,
        link: fullGroupUrl,
        read: false,
        createdAt: Timestamp.now(),
      })

      // Open the success dialog modal
      setDialogOpen(true)
    } catch (error) {
      toast.error("Failed to create group. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedGroupLink)
      setCopyStatus("Copied!")
    } catch (err) {
      setCopyStatus("Failed to copy")
    }
  }

  const handleJoinGroup = () => {
    router.push(`/group-chat/${groupId}`)
  }

  return (
    <div className="space-y-6">
      <Typography variant="h3">Confirm Group Details</Typography>

      <div className="grid grid-cols-2 gap-4">
        <Typography variant="span" className="font-semibold">
          Transaction Type:
        </Typography>
        <Typography variant="span">{transactionType}</Typography>

        <Typography variant="span" className="font-semibold">
          Item Description:
        </Typography>
        <Typography variant="span">{itemDescription}</Typography>

        <Typography variant="span" className="font-semibold">
          Price:
        </Typography>
        <Typography variant="span">
          {currency} {price.toFixed(2)}
        </Typography>

        <Typography variant="span" className="font-semibold">
          Escrow Fee:
        </Typography>
        <Typography variant="span">
          {currency} {escrowFee.toFixed(2)}
        </Typography>

        <Typography variant="span" className="font-semibold">
          Fee Responsibility:
        </Typography>
        <Typography variant="span">{escrowFeeResponsibility}</Typography>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button
          onClick={handleCreateGroup}
          className="ml-4 flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Confirm and Create Group"}
        </Button>
      </div>

      {/* Success Dialog Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            {/* Success Icon and Message */}
            <div className="flex flex-col items-center mb-4">
              <span className="text-green-600 text-6xl mb-2">✅</span>
              <Typography variant="h4" className="mb-2 text-center">
                Group Created Successfully!
              </Typography>
              <Typography variant="p" className="mb-4 text-center">
                Please copy the group link below and send it to your seller.
              </Typography>
            </div>

            {/* Group Link Box with Copy Icon */}
            <div className="flex items-center border p-2 rounded mb-4">
              <input
                type="text"
                readOnly
                value={generatedGroupLink}
                className="flex-1 p-2 border-none outline-none"
              />
              <Button variant="outline" onClick={handleCopyLink} className="ml-2">
                Copy
              </Button>
              {copyStatus && (
                <span className="ml-2 text-sm text-green-600">
                  {copyStatus}
                </span>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="confirmCopied"
                checked={isLinkCopiedConfirmed}
                onChange={(e) => setIsLinkCopiedConfirmed(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="confirmCopied">
                I confirm that I have copied the Xcrow group link.
              </label>
            </div>

            {/* Join Group Button */}
            <Button
              onClick={handleJoinGroup}
              disabled={!isLinkCopiedConfirmed}
              className="w-full"
            >
              Join your Created Xcrow Group
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupConfirmation
