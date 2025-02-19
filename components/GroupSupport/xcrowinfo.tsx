"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModalButtonProps } from "@/lib/types"

// Combine your existing fields + the shared ModalButtonProps
interface XcrowInfoProps extends ModalButtonProps {
  itemDescription: string
  price: number
  escrowFee: number
  escrowFeeResponsibility: string
  transactionType: string
  currency: string
}

export default function XcrowInfo({
  itemDescription,
  price,
  escrowFee,
  escrowFeeResponsibility,
  transactionType,
  currency,

  // from ModalButtonProps
  buttonClass = "text-xs md:text-sm h-8 flex items-center justify-center",
  iconSize = 20,
}: XcrowInfoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={buttonClass}>
          <Info style={{ width: iconSize, height: iconSize }} className="mr-1" />
          Transaction Details
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[425px] sm:w-full md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Xcrow Group Details</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Transaction Summary
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm sm:text-base">
          <p>
            <strong>Item Description:</strong> {itemDescription}
          </p>
          <p>
            <strong>Transaction Type:</strong> {transactionType}
          </p>
          <p>
            <strong>Price:</strong>{" "}
            {currency === "KES" ? `KES ${price.toFixed(2)}` : `$${price.toFixed(2)}`}
          </p>
          <p>
            <strong>Escrow Fee:</strong>{" "}
            {currency === "KES" ? `KES ${escrowFee.toFixed(2)}` : `$${escrowFee.toFixed(2)}`}
          </p>
          <p>
            <strong>Fee Responsibility:</strong> {escrowFeeResponsibility}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
