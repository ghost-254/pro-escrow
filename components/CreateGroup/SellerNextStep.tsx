//components/CreateGroup/SellerNextStep.tsx

/* eslint-disable */
"use client"

import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { previousStep, resetGroupCreation } from "@/lib/slices/groupCreationSlice"
import { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Typography from "@/components/ui/typography"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebaseConfig"
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { Card } from "@/components/ui/card"

const SellerNextStep = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { itemDescription, price, serviceNature, currency, escrowFeeResponsibility } = useSelector(
    (state: RootState) => state.groupCreation
  )
  const user = useSelector((state: RootState) => state.auth.user)
  const [groupLink, setGroupLink] = useState("")

  // Helper to extract group ID from the link
  const getGroupIdFromLink = (link: string): string | null => {
    try {
      const url = new URL(link)
      const segments = url.pathname.split("/")
      if (segments.length >= 3 && segments[1] === "group-chat") {
        return segments[2]
      }
    } catch {
      // Ignore parsing errors
    }
    return null
  }

  const handleJoinGroup = async () => {
    if (!groupLink.trim()) {
      toast.error("Please paste the group link.")
      return
    }
    const groupId = getGroupIdFromLink(groupLink.trim())
    if (!groupId) {
      toast.error("Invalid Link: Unable to extract a group ID from the link.")
      return
    }
    if (!user?.uid) {
      toast.error("Not Authenticated: You must be logged in to join a group.")
      return
    }
    try {
      const groupRef = doc(db, "groups", groupId)
      const groupSnap = await getDoc(groupRef)
      if (!groupSnap.exists()) {
        toast.error("Invalid Group Link: The group does not exist.")
        return
      }

      // Record seller summary in the "sellerSummaries" collection
      await addDoc(collection(db, "sellerSummaries"), {
        sellerId: user.uid,
        itemDescription,
        price,
        serviceNature,
        currency,
        escrowFeeResponsibility,
        createdAt: Timestamp.now(),
      })

      // Update group's participants
      await updateDoc(groupRef, {
        participants: arrayUnion(user.uid),
      })
      const shortGroupName = `Xcrow_${groupId.slice(0, 4)}`
      const data = groupSnap.data() || {}
      const allParticipants = (data.participants || []) as string[]
      const otherParticipants = allParticipants.filter((par) => par !== user.uid)

      // Notification for seller
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `You joined ${shortGroupName} group.`,
        link: `/group-chat/${groupId}`,
        read: false,
        createdAt: Timestamp.now(),
      })

      // Notification for existing participants
      const joinedMsg = user.displayName
        ? `User ${user.displayName} has joined ${shortGroupName} group chat.`
        : `User ${user.uid} has joined ${shortGroupName} group chat.`
      for (const participantUid of otherParticipants) {
        await addDoc(collection(db, "notifications"), {
          userId: participantUid,
          message: joinedMsg,
          link: `/group-chat/${groupId}`,
          read: false,
          createdAt: Timestamp.now(),
        })
      }
      toast.success(`You have been added to group ${groupId}.`)
      // Reset the group creation state before redirecting
      dispatch(resetGroupCreation())
      router.push(`/group-chat/${groupId}`)
    } catch {
      toast.error("Failed to join the group.")
    }
  }

  const handleBack = () => {
    dispatch(previousStep())
  }

  return (
    <div className="space-y-6">
      <Typography variant="h2" className="mb-4">Seller Confirmation</Typography>
      <Typography variant="h4" className="mb-2">Summary of Your Details</Typography>
      <Card className="p-4 mb-4">
        <div className="space-y-2">
          <Typography variant="p"><strong>Item/Service:</strong> {itemDescription}</Typography>
          <Typography variant="p">
            <strong>Price:</strong>{" "}
            {currency === "KES" ? `KES ${price.toFixed(2)}` : `$${price.toFixed(2)}`}
          </Typography>
          <Typography variant="p"><strong>Service:</strong> {serviceNature}</Typography>
          <Typography variant="p"><strong>Escrow Fee Responsibility:</strong> {escrowFeeResponsibility}</Typography>
        </div>
      </Card>
      <Typography variant="h3" className="mb-4">
        Ask the buyer to send you the Xcrow Group link. Paste it below and click <strong>Join Group</strong>.
      </Typography>
      <Input
        placeholder="Paste group link here..."
        value={groupLink}
        onChange={(e) => setGroupLink(e.target.value)}
      />
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handleBack}>Back</Button>
        <Button onClick={handleJoinGroup} variant="secondary">Join Group</Button>
      </div>
    </div>
  )
}

export default SellerNextStep
