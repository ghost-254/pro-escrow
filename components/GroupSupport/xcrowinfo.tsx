"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface XcrowInfoProps {
  itemDescription: string
  price: number
  escrowFee: number
  escrowFeeResponsibility: string
  transactionType: string
  currency: string
  buttonClass?: string
  iconSize?: number
}

export default function XcrowInfo({
  itemDescription,
  price,
  escrowFee,
  escrowFeeResponsibility,
  transactionType,
  currency,
  buttonClass = "text-xs md:text-sm h-8 flex items-center justify-center",
  iconSize = 20,
}: XcrowInfoProps) {
  return (
    <TooltipProvider>
      <Dialog>
        <Tooltip>
          {/* Combine both triggers: DialogTrigger + TooltipTrigger, pointing to the same Button */}
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className={buttonClass}>
                <Info style={{ width: iconSize, height: iconSize }} className="mr-1" />
                Transaction Details
              </Button>
            </DialogTrigger>
          </TooltipTrigger>

          <TooltipContent>
            <p className="text-xs">View more group transaction details</p>
          </TooltipContent>

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
        </Tooltip>
      </Dialog>
    </TooltipProvider>
  )
}
