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
import { toast } from "react-toastify"
import { Headphones } from "lucide-react"
import { ModalButtonProps } from "@/lib/types"
import emailjs from "@emailjs/browser"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const EngageSupport: React.FC<ModalButtonProps> = ({
  buttonClass = "text-sm h-10 flex items-center",
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [comments, setComments] = useState("")

  // Called on "Engage" to send email
  const handleEngage = async () => {
    if (!reason) {
      toast.error("Please select a reason for support.")
      return
    }

    const groupUrl =
      typeof window !== "undefined" ? window.location.href : "Unavailable"

    // Prepare template parameters for EmailJS
    const templateParams = {
      reason,
      comments,
      groupUrl,
    }

    try {
      const serviceId = "YOUR_SERVICE_ID"
      const templateId = "YOUR_TEMPLATE_ID"
      const publicKey = "YOUR_PUBLIC_KEY"

      // Send email via EmailJS
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey)

      if (result.status === 200) {
        toast.success("Support request sent. Please wait for assistance.")
      } else {
        toast.error("Failed to send support request. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to send support request. Please try again.")
    }

    // Close dialog & reset fields
    setIsOpen(false)
    setReason("")
    setComments("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* 
        We nest <Tooltip> -> <TooltipTrigger asChild> -> <DialogTrigger asChild> -> <Button> 
        so that the same Button shows a tooltip on hover and opens the dialog on click.
      */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className={buttonClass}>
                <Headphones style={{ width: iconSize, height: iconSize }} className="mr-1" />
                Engage Support
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Use this to seek our help</p>
          </TooltipContent>

          {/* The Dialog content is placed here to keep everything in one place */}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Engage Support</DialogTitle>
              <DialogDescription>
                Select a reason and (optionally) provide comments.
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
                <option value="Technical Issue">Technical Issue</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-medium mt-2">
                Comments (Optional)
              </label>
              <textarea
                className="border w-full p-2 rounded"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Additional details..."
              />

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEngage}>Engage</Button>
              </div>
            </div>
          </DialogContent>
        </Tooltip>
      </TooltipProvider>
    </Dialog>
  )
}

export default EngageSupport
