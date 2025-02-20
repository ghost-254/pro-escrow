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
import { AlertTriangle } from "lucide-react"
import { toast } from "react-toastify"
import { ModalButtonProps } from "@/lib/types"

// Shadcn UI tooltip components
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip"

const DisputeTransaction: React.FC<ModalButtonProps> = ({
  buttonClass = "text-sm h-10 flex items-center",
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [comments, setComments] = useState("")

  const handleDispute = () => {
    if (!reason) {
      toast.error("Please select a reason for dispute.")
      return
    }
    toast.success("Dispute filed. (Placeholder logic here.)")
    setIsOpen(false)
    setReason("")
    setComments("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/*
        We use <TooltipProvider> at the top-level. 
        Then nest <Tooltip> with <TooltipTrigger asChild>, 
        wrapping <DialogTrigger asChild>, so the same Button triggers both the tooltip (hover) & dialog (click).
      */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className={buttonClass}>
                <AlertTriangle style={{ width: iconSize, height: iconSize }} className="mr-1" />
                File Formal Dispute
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">File a formal complaint about this transaction.</p>
          </TooltipContent>

          {/* The DialogContent belongs here or as a sibling to Tooltip. Either way works */}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dispute Transaction</DialogTitle>
              <DialogDescription>
                File a formal complaint about this transaction.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <label className="block text-sm font-medium">Reason</label>
              <select
                className="border w-full p-2 rounded"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Product not as described">Product not as described</option>
                <option value="Service not delivered">Service not delivered</option>
                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-medium mt-2">Comments (Optional)</label>
              <textarea
                className="border w-full p-2 rounded"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Additional details..."
              />

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleDispute}>Submit</Button>
              </div>
            </div>
          </DialogContent>
        </Tooltip>
      </TooltipProvider>
    </Dialog>
  )
}

export default DisputeTransaction
