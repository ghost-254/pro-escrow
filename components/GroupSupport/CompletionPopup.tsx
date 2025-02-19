//components/GroupSupport/CompletionPopup.tsx
/* eslint-disable */

"use client"

import React, { useState, ChangeEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"

/**
 * The "Agree/Disagree" completion pop-up.
 */
interface CompletionPopupProps {
  open: boolean
  message: string
  onAgree: () => void
  onDisagree: () => void
  // Called if we try to close the dialog externally (we disallow outside clicks)
  onClose: (open: boolean) => void
}

const CompletionPopup: React.FC<CompletionPopupProps> = ({
  open,
  message,
  onAgree,
  onDisagree,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<"agree" | "disagree" | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleSelectOption = (option: "agree" | "disagree") => {
    setSelectedOption(option)
    setConfirmed(false)
  }

  // Use standard <input type="checkbox" /> so we avoid onCheckedChange issues
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmed(e.target.checked)
  }

  return (
    <Dialog
      open={open}
      // We disallow closing by clicking outside
      onOpenChange={(val) => {
        if (!val) return
        onClose(val)
      }}
    >
      <DialogContent className="mx-auto w-full max-w-md sm:max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Confirm Completion</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">{message}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Agree Card */}
            <div
              className={`border p-4 rounded cursor-pointer ${
                selectedOption === "agree" ? "bg-green-100 border-green-500" : "bg-white"
              }`}
              onClick={() => handleSelectOption("agree")}
            >
              <Typography variant="p" className="text-xs font-semibold">
                Agree
              </Typography>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOption === "agree" && confirmed}
                  onChange={handleCheckboxChange}
                />
                <Typography variant="p" className="text-xs">
                  I confirm that I Agree
                </Typography>
              </div>
            </div>
            {/* Disagree Card */}
            <div
              className={`border p-4 rounded cursor-pointer ${
                selectedOption === "disagree" ? "bg-red-100 border-red-500" : "bg-white"
              }`}
              onClick={() => handleSelectOption("disagree")}
            >
              <Typography variant="p" className="text-xs font-semibold">
                Disagree
              </Typography>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOption === "disagree" && confirmed}
                  onChange={handleCheckboxChange}
                />
                <Typography variant="p" className="text-xs">
                  I confirm that I Disagree
                </Typography>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (selectedOption === "agree" && confirmed) onAgree()
                if (selectedOption === "disagree" && confirmed) onDisagree()
              }}
              disabled={!(selectedOption && confirmed)}
              className="text-xs"
            >
              {selectedOption === "agree" ? "Agree" : "Disagree"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompletionPopup
