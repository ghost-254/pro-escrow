//components/GroupSupport/CompletionPopup.tsx
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

import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

interface CompleteTransactionProps extends ModalButtonProps {
  groupId: string
}

/**
 * Mark the transaction as complete for either buyer or seller.
 * If both booleans become true => status="complete".
 *
 * Also, if user is the first to click "Complete" (meaning both sides were false),
 * set transactionStatus.initiator = "buyer"|"seller" and rejection=null.
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
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) {
        toast.error("Group not found.")
        return
      }
      const data = snap.data() || {}

      // Our participants array is e.g.:
      // [
      //   { uid: "UID_OF_BUYER" }, // or just "UID"
      //   { uid: "UID_OF_SELLER" }
      // ]
      const participants = data.participants || []
      if (participants.length < 2) {
        toast.error("Not enough participants to complete.")
        return
      }

      if (data.status === "complete") {
        toast.info("Transaction is already complete.")
        setIsOpen(false)
        setSelectedReason("")
        return
      }

      // Identify buyer/seller UIDs
      let buyerUid = ""
      let sellerUid = ""
      if (typeof participants[0] === "string") {
        buyerUid = participants[0]
      } else if (participants[0] && typeof participants[0] === "object") {
        buyerUid = participants[0].uid
      }
      if (typeof participants[1] === "string") {
        sellerUid = participants[1]
      } else if (participants[1] && typeof participants[1] === "object") {
        sellerUid = participants[1].uid
      }

      const isBuyer = user.uid === buyerUid
      const isSeller = user.uid === sellerUid
      if (!isBuyer && !isSeller) {
        toast.error("You are not a participant in this group.")
        return
      }

      const ts = data.transactionStatus || {
        buyerComplete: false,
        sellerComplete: false,
      }

      // If both buyerComplete & sellerComplete are false => user is the first
      // => set initiator = "buyer"|"seller", rejection=null
      if (!ts.buyerComplete && !ts.sellerComplete) {
        ts.initiator = isBuyer ? "buyer" : "seller"
        ts.rejection = null
      }

      // Now set the correct side to true
      if (isBuyer) {
        ts.buyerComplete = true
      }
      if (isSeller) {
        ts.sellerComplete = true
      }

      // If both are true => status=complete
      let newStatus = data.status || "active"
      if (ts.buyerComplete && ts.sellerComplete) {
        newStatus = "complete"
        // Clear initiator & rejection because final
        ts.initiator = null
        ts.rejection = null
      }

      await updateDoc(groupRef, {
        transactionStatus: ts,
        status: newStatus,
      })

      if (newStatus === "complete") {
        toast.success("Both parties have completed. Transaction is now COMPLETE.")
      } else {
        toast.success("Your completion is recorded. Waiting for the other party.")
      }

      setIsOpen(false)
      setSelectedReason("")
    } catch (error: any) {
      toast.error(`Failed to mark transaction as complete. ${error.message || ""}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={buttonClass}>
          <CheckCircle style={{ width: iconSize, height: iconSize }} className="mr-1" />
          Complete
        </Button>
      </DialogTrigger>
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
    </Dialog>
  )
}

export default CompleteTransaction
