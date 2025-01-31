"use client"

import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { previousStep } from "@/lib/slices/groupCreationSlice"
import { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Typography from "@/components/ui/typography"
import { toast } from "../../hooks/use-toast"
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

const SellerNextStep = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [groupLink, setGroupLink] = useState("")

  // Helper to parse group ID from link
  const getGroupIdFromLink = (link: string): string | null => {
    try {
      // Convert string to a URL object
      const url = new URL(link)
      // e.g. url.pathname => "/group-chat/zZoySsK1UHE0BqAIfwyg"
      const segments = url.pathname.split("/")
      // segments => ["", "group-chat", "zZoySsK1UHE0BqAIfwyg"]
      if (segments.length >= 3 && segments[1] === "group-chat") {
        return segments[2]
      }
    } catch {
    }
    return null
  }

  const handleJoinGroup = async () => {
    if (!groupLink.trim()) {
      toast({
        title: "Error",
        description: "Please paste the group link.",
        variant: "destructive",
      })
      return
    }

    const groupId = getGroupIdFromLink(groupLink.trim())
    if (!groupId) {
      toast({
        title: "Invalid Link",
        description: "Unable to extract a group ID from the link.",
        variant: "destructive",
      })
      return
    }

    if (!user?.uid) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to join a group.",
        variant: "destructive",
      })
      return
    }

    try {
      // 1) Update the group's participants array in Firestore
      const groupRef = doc(db, "groups", groupId)
      await updateDoc(groupRef, {
        participants: arrayUnion(user.uid),
      })

      // 2) Generate a short group name: e.g. "Xcrow_zZoy"
      const shortGroupName = `Xcrow_${groupId.slice(0, 4)}`

      // 3) Retrieve the full group doc to find other participants
      const groupSnap = await getDoc(groupRef)
      let otherParticipants: string[] = []
      if (groupSnap.exists()) {
        const data = groupSnap.data() || {}
        // data.participants should now include the seller
        const allParticipants = (data.participants || []) as string[]
        // Exclude the seller => the rest are presumably buyer(s)
        otherParticipants = allParticipants.filter((par) => par !== user.uid)
      }

      // 4) Create a notification for the seller
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: `You joined ${shortGroupName} group.`,
        link: `/group-chat/${groupId}`,
        read: false,
        createdAt: Timestamp.now(),
      })

      // 5) Create notifications for the existing participants
      // e.g. "User [UID or displayName] joined the group chat."
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

      toast({
        title: "Joined Group",
        description: `You have been added to group ${groupId}.`,
        variant: "default",
      })

      // Optionally open in same tab
      router.push(`/group-chat/${groupId}`)
    } catch {
      toast({
        title: "Error",
        description: "Failed to join the group.",
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    dispatch(previousStep())
  }

  return (
    <div className="space-y-6">
      <Typography variant="h2" className="mb-4">
        Seller Confirmation
      </Typography>
      <Typography variant="h3">
        Ask the buyer to send you the Xcrow Group link. Paste it below and click{" "}
        <strong>Join</strong>.
      </Typography>

      <Input
        placeholder="Paste group link here..."
        value={groupLink}
        onChange={(e) => setGroupLink(e.target.value)}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleJoinGroup} variant="secondary">
          Join Group
        </Button>
      </div>
    </div>
  )
}

export default SellerNextStep
