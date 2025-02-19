//components/GroupSupport/RejectionPopup.tsx

"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"

interface RejectionPopupProps {
  open: boolean
  message: string  // e.g. "Seller Rejected your Completion Request..."
  onClose: () => void
}

/**
 * Pop-up to show the initiator that the other user has rejected their request.
 * We do NOT allow closing by outside click. The user must click OK.
 */
const RejectionPopup: React.FC<RejectionPopupProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        // The spec says no outside close. If val=false => user clicked away or ESC
        // We'll just close it properly if that happens.
        if (!val) onClose()
      }}
    >
      <DialogContent className="mx-auto w-full max-w-md sm:max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Request Rejected</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            <Typography variant="p" className="text-sm">
              {message}
            </Typography>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="text-xs">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RejectionPopup
