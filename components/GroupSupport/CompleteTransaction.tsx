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
import { CheckCircle } from "lucide-react"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { ModalButtonProps } from "@/lib/types"

// Import Shadcn UI tooltip components
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface CompleteTransactionProps extends ModalButtonProps {
  groupId: string
}

/**
 * Mark the transaction as complete. 
 * - If only one side is complete, we notify the other user. 
 * - If both are complete, the final logic in `page.tsx` handles the payout and final status.
 */
const CompleteTransaction: React.FC<CompleteTransactionProps> = ({
  groupId,
  buttonClass = "text-sm h-10 flex items-center",
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")

  const user = useSelector((state: RootState) => state.auth.user)

  const handleComplete = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason.")
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
          action: "request-complete",
          reason: selectedReason,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to mark this group as complete.")
      }

      toast.success(result.message || "Your completion request has been recorded.")

      setIsOpen(false)
      setSelectedReason("")
    } catch (error: any) {
      toast.error(`Failed to mark transaction as complete. ${error.message || ""}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className={buttonClass}>
                <CheckCircle style={{ width: iconSize, height: iconSize }} className="mr-1" />
                Complete
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Mark this transaction as complete.</p>
          </TooltipContent>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Transaction</DialogTitle>
              <DialogDescription>
                Confirm that this order or service is fully completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <label className="block text-sm font-medium">Select a Reason</label>
              <select
                className="border w-full p-2 rounded"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Order Successfully Completed">Order Successfully Completed</option>
                <option value="Service Delivered">Service Delivered</option>
                <option value="Other">Other</option>
              </select>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleComplete}>Confirm</Button>
              </div>
            </div>
          </DialogContent>
        </Tooltip>
      </TooltipProvider>
    </Dialog>
  )
}

export default CompleteTransaction
