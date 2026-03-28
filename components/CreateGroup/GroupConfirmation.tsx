/* eslint-disable */
"use client"

import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { previousStep, resetGroupCreation } from "@/lib/slices/groupCreationSlice"

/**
 * Helper: compute how much the buyer must pay.
 */
function getBuyerPayableAmount(
  price: number,
  escrowFee: number,
  escrowFeeResponsibility: "buyer" | "seller" | "50/50" | null
) {
  if (escrowFeeResponsibility === "buyer") {
    return price + escrowFee
  } else if (escrowFeeResponsibility === "50/50") {
    return price + escrowFee / 2
  }
  // if "seller" or null
  return price
}

const GroupConfirmation = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  // Basic info from Redux
  const user = useSelector((state: RootState) => state.auth.user)
  const {
    transactionType,
    price,
    escrowFee,
    currency,
    itemDescription,
    escrowFeeResponsibility,
  } = useSelector((state: RootState) => state.groupCreation)

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

  // Only the buyer actually pays at creation time (in your scenario)
  const buyerAmount = getBuyerPayableAmount(price, escrowFee, escrowFeeResponsibility)

  const handleCreateGroup = async () => {
    if (!user) {
      toast.error("Please log in first.")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionType,
          price,
          escrowFee,
          currency,
          itemDescription,
          escrowFeeResponsibility,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create the secure group.")
      }

      setGroupId(result.groupId)
      setGeneratedGroupLink(result.groupUrl)
      setDialogOpen(true)
    } catch (error: any) {
      toast.error("Failed to create group. " + error?.message || "")
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
    // Reset the group creation state before redirecting
    dispatch(resetGroupCreation())
    // Navigate to the newly created group
    if (groupId) {
      router.push(`/dashboard/group-chat/${groupId}`)
    } else {
      toast.error("No group ID found.")
    }
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

      {/* If the buyer is paying, show them the exact total being deducted */}
      {transactionType === "buying" && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md">
          <Typography variant="p" className="font-semibold">
            You (the Buyer) will pay:
          </Typography>
          <Typography variant="h4" className="mt-1">
            {currency} {buyerAmount.toFixed(2)}
          </Typography>
          <Typography variant="p" className="text-sm text-gray-500">
            This includes your share of the escrow fee.
          </Typography>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button onClick={handleCreateGroup} className="ml-4 flex-1" disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Confirm and Create Group"}
        </Button>
      </div>

      {/* Success Dialog Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center mb-4">
              <span className="text-green-600 text-6xl mb-2">✅</span>
              <Typography variant="h4" className="mb-2 text-center">
                Group Created Successfully!
              </Typography>
              <Typography variant="p" className="mb-4 text-center">
                Please copy the group link below and send it to the other party.
              </Typography>
            </div>
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
                <span className="ml-2 text-sm text-green-600">{copyStatus}</span>
              )}
            </div>
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
