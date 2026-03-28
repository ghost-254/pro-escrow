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
      if (segments.length >= 4 && segments[1] === "dashboard" && segments[2] === "group-chat") {
        return segments[3]
      }
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
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          itemDescription,
          price,
          serviceNature,
          currency,
          escrowFeeResponsibility,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to join the secure group.")
      }

      toast.success(`You have been added to group ${groupId}.`)
      // Reset the group creation state before redirecting
      dispatch(resetGroupCreation())
      router.push(`/dashboard/group-chat/${groupId}`)
    } catch (error: any) {
      toast.error(error?.message || "Failed to join the group.")
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
