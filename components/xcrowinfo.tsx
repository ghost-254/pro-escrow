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

interface XcrowInfoProps {
  depositStatus: string
  depositId?: string
  itemDescription: string
  price: number
  escrowFee: number
  responsibility: string
  transactionType: string
}

export default function XcrowInfo({
  depositStatus,
  depositId,
  itemDescription,
  price,
  escrowFee,
  responsibility,
  transactionType,
}: XcrowInfoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-ghost text-xs md:text-sm h-8">
          <Info className="w-4 h-4 mr-1" /> Details
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[425px] sm:w-full md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Xcrow Group Details</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">Transaction Summary</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
          <p>
            <strong>Deposit Status:</strong> {depositStatus}
          </p>
          {depositId && (
            <p>
              <strong>Deposit ID:</strong> {depositId}
            </p>
          )}
          <p>
            <strong>Item Description:</strong> {itemDescription}
          </p>
          <p>
            <strong>Transaction Type:</strong> {transactionType}
          </p>
          <p>
            <strong>Price:</strong> ${price.toFixed(2)}
          </p>
          <p>
            <strong>Escrow Fee:</strong> ${escrowFee.toFixed(2)}
          </p>
          <p>
            <strong>Fee Responsibility:</strong> {responsibility}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

