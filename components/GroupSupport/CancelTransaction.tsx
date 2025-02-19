//components/GroupSupport/CancelTransaction.tsx
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
import { XCircle } from "lucide-react"
import { toast } from "react-toastify"
import { ModalButtonProps } from "@/lib/types"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc } from "firebase/firestore"

interface CancelTransactionProps extends ModalButtonProps {
  groupId: string
}

/**
 * This is similar to "CompleteTransaction.tsx," but for requesting cancellation.
 * We'll track `buyerCancel`, `sellerCancel`, `cancelInitiator`, `cancelRejection` in Firestore.
 */
const CancelTransaction: React.FC<CancelTransactionProps> = ({
  groupId,
  buttonClass = "text-sm h-10 flex items-center",
  iconSize = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const [confirmCancel, setConfirmCancel] = useState(false)

  const user = useSelector((state: RootState) => state.auth.user)

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason to cancel.")
      return
    }
    if (!confirmCancel) {
      toast.error("Please confirm cancellation by checking the box.")
      return
    }
    if (!user?.uid) {
      toast.error("You must be logged in.")
      return
    }

    try {
      // 1) Get group doc
      // 2) Identify if the user is buyer or seller
      // 3) If this is the first time (both buyerCancel & sellerCancel are false),
      //    set cancelInitiator = "buyer"/"seller" & set that side's "cancel" to true, cancelRejection=null.
      // 4) If it ends up both sides are true => status="cancelled"
      const groupRef = doc(db, "groups", groupId)
      // In your real code, you likely pass `groupId` as a prop to CancelTransaction (like in CompleteTransaction).
      // For example: const groupRef = doc(db, "groups", groupId);

      const snap = await getDoc(groupRef)
      if (!snap.exists()) {
        toast.error("Group not found.")
        return
      }

      const data = snap.data() || {}
      const participants = data.participants || []
      if (participants.length < 2) {
        toast.error("Not enough participants to cancel.")
        return
      }

      // Identify buyer vs seller
      let buyerUid = ""
      let sellerUid = ""
      if (typeof participants[0] === "string") buyerUid = participants[0]
      else if (participants[0] && typeof participants[0] === "object") {
        buyerUid = participants[0].uid
      }
      if (typeof participants[1] === "string") sellerUid = participants[1]
      else if (participants[1] && typeof participants[1] === "object") {
        sellerUid = participants[1].uid
      }

      const isBuyer = user.uid === buyerUid
      const isSeller = user.uid === sellerUid
      if (!isBuyer && !isSeller) {
        toast.error("You are not a participant in this group.")
        return
      }

      // transactionStatus
      const ts = data.transactionStatus || {
        buyerCancel: false,
        sellerCancel: false,
        cancelInitiator: null,
        cancelRejection: null,
      }

      // If it's the first time (both false), set cancelInitiator, set that side's "cancel" to true
      if (!ts.buyerCancel && !ts.sellerCancel) {
        ts.cancelInitiator = isBuyer ? "buyer" : "seller"
        ts.cancelRejection = null
      }

      if (isBuyer) {
        ts.buyerCancel = true
      } else if (isSeller) {
        ts.sellerCancel = true
      }

      // If both are now true => we finalize as "cancelled"
      let newStatus = data.status || "active"
      if (ts.buyerCancel && ts.sellerCancel) {
        newStatus = "cancelled"
        ts.cancelInitiator = null
        ts.cancelRejection = null
      }

      await updateDoc(groupRef, {
        transactionStatus: ts,
        status: newStatus,
      })

      if (newStatus === "cancelled") {
        toast.success("Both parties have agreed. Transaction is now CANCELLED.")
      } else {
        toast.success("Your cancellation request is recorded. Waiting for the other party.")
      }
    } catch (err: any) {
      toast.error("Failed to request cancellation. " + err.message)
    }

    // Reset local state
    setIsOpen(false)
    setSelectedReason("")
    setConfirmCancel(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={buttonClass}>
          <XCircle style={{ width: iconSize, height: iconSize }} className="mr-1" />
          Cancel Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Transaction</DialogTitle>
          <DialogDescription>
            Select a reason to request cancellation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <label className="block text-sm font-medium">Reason</label>
          <select
            className="border w-full p-2 rounded"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
          >
            <option value="">Select a reason</option>
            <option value="Service Not Delivered">Service Not Delivered</option>
            <option value="Delayed Delivery">Delayed Delivery</option>
            <option value="Other">Other</option>
          </select>

          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="confirmCancel"
              checked={confirmCancel}
              onChange={(e) => setConfirmCancel(e.target.checked)}
            />
            <label htmlFor="confirmCancel" className="text-sm">
              I confirm that I want to cancel the transaction.
            </label>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCancel}>Submit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CancelTransaction
