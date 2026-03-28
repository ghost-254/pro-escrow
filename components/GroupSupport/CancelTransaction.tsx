//components/GroupSupport/CancelTransaction.tsx
/* eslint-disable */
"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { toast } from "react-toastify"
import { ModalButtonProps } from "@/lib/types"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface CancelTransactionProps extends ModalButtonProps {
  groupId: string
}

/**
 * This is similar to "CompleteTransaction.tsx," but for requesting cancellation.
 * We'll track `buyerCancel`, `sellerCancel`, `cancelInitiator`, `cancelRejection` in Firestore.
 */
const CancelTransaction: React.FC<CancelTransactionProps> = ({
  groupId,
  buttonClass = "text-sm h-10 flex items-center",
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const [confirmCancel, setConfirmCancel] = useState(false)

  const user = useSelector((state: RootState) => state.auth.user)

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason to cancel.")
      return
    }
    if (!confirmCancel) {
      toast.error("Please confirm cancellation by checking the box.")
      return
    }
    if (!user?.uid) {
      toast.error("You must be logged in.")
      return
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request-cancel",
          reason: selectedReason,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit the cancellation request.")
      }

      toast.success(result.message || "Your cancellation request has been recorded.")
    } catch (err: any) {
      toast.error("Failed to request cancellation. " + err.message)
    }

    // Reset local state
    setIsOpen(false)
    setSelectedReason("")
    setConfirmCancel(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Wrap with TooltipProvider -> Tooltip -> TooltipTrigger asChild -> DialogTrigger asChild -> Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className={buttonClass}>
                <XCircle style={{ width: iconSize, height: iconSize }} className="mr-1" />
                Cancel Transaction
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Use this button to cancel this transaction</p>
          </TooltipContent>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Transaction</DialogTitle>
              <DialogDescription>
                Select a reason to request cancellation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <label className="block text-sm font-medium">Reason</label>
              <select
                className="border w-full p-2 rounded"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Service Not Delivered">Service Not Delivered</option>
                <option value="Delayed Delivery">Delayed Delivery</option>
                <option value="Other">Other</option>
              </select>

              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="confirmCancel"
                  checked={confirmCancel}
                  onChange={(e) => setConfirmCancel(e.target.checked)}
                />
                <label htmlFor="confirmCancel" className="text-sm">
                  I confirm that I want to cancel the transaction.
                </label>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleCancel}>Submit</Button>
              </div>
            </div>
          </DialogContent>
        </Tooltip>
      </TooltipProvider>
    </Dialog>
  )
}

export default CancelTransaction
