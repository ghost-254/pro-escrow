//components/GroupSupport/CancelRejectionPopup.tsx

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

interface CancelRejectionPopupProps {
  open: boolean
  message: string
  onClose: () => void
}

/**
 * Pop-up to show the cancel initiator that the other user has rejected their cancel request.
 */
const CancelRejectionPopup: React.FC<CancelRejectionPopupProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose()
      }}
    >
      <DialogContent className="mx-auto w-full max-w-md sm:max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Cancel Request Rejected</DialogTitle>
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

export default CancelRejectionPopup
