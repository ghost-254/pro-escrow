"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"
import {
  nextStep,
  previousStep,
  setSellerSummaryDocId,
} from "@/lib/slices/groupCreationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Typography from "@/components/ui/typography"
import { toast } from "../../hooks/use-toast"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  Timestamp
} from "firebase/firestore"

const DepositFlow = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  // Pull from Redux state
  const {
    transactionType,
    price,
    escrowFee,
    chargeFeeFromBuyerPayment,
    itemDescription,
    serviceNature,
    escrowFeeResponsibility,
    paymentSource,
    sellerSummaryDocId,  // <--- the ID we store in Redux
  } = useSelector((state: RootState) => state.groupCreation)

  // Pull user from auth slice
  const user = useSelector((state: RootState) => state.auth.user)
  const userUid = user?.uid || "N/A"

  const isSeller = transactionType === "selling"
  const isBuyer = transactionType === "buying"

  // 1) Compute the buyer's deposit, if user is buyer
  //    The logic depends on escrowFeeResponsibility
  let buyerDeposit = price
  if (isBuyer) {
    switch (escrowFeeResponsibility) {
      case "buyer":
        buyerDeposit = price + escrowFee
        break
      case "seller":
        buyerDeposit = price // no escrow fee added
        break
      case "50/50":
        buyerDeposit = price + escrowFee / 2
        break
      default:
        // fallback if not set (you could handle error if no selection)
        buyerDeposit = price + escrowFee
        break
    }
  }

  // 2) For the seller's deposit logic:
  //    If the fee is from buyer's payment => $0
  //    else escrowFee
  let sellerDeposit = 0
  if (isSeller) {
    sellerDeposit = chargeFeeFromBuyerPayment ? 0 : escrowFee
  }

  // We show in the UI based on if buyer or seller
  const totalDeposit = isBuyer
    ? buyerDeposit
    : sellerDeposit

  // Seller form saving logic
  const handleSaveSellerDetails = async () => {
    try {
      if (sellerSummaryDocId) {
        // Update existing doc
        const docRef = doc(db, "sellerSummaries", sellerSummaryDocId)
        await updateDoc(docRef, {
          userUid,
          transactionType,
          itemDescription,
          serviceNature,
          escrowFeeResponsibility,
          paymentSource,
          price,
          escrowFee,
          chargeFeeFromBuyerPayment,
          updatedAt: Timestamp.now(),
        })
      } else {
        // Create new doc
        const newDoc = await addDoc(collection(db, "sellerSummaries"), {
          userUid,
          transactionType,
          itemDescription,
          serviceNature,
          escrowFeeResponsibility,
          paymentSource,
          price,
          escrowFee,
          chargeFeeFromBuyerPayment,
          createdAt: Timestamp.now(),
        })

        dispatch(setSellerSummaryDocId(newDoc.id))
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save seller summary.",
        variant: "destructive",
      })
    }
  }

  // Next action
  const handleAction = async () => {
    if (isSeller) {
      // Save seller details in Firestore
      await handleSaveSellerDetails()
      // Move to next step (SellerNextStep)
      dispatch(nextStep())
    } else if (isBuyer) {
      // Buyer => go to deposit page
      router.push("/create-group/deposit")
    } else {
      toast({
        title: "Error",
        description: "Invalid transaction type.",
        variant: "destructive",
      })
    }
  }

  return (
    <div 
      className="
        flex flex-col 
        max-h-[80vh] 
        overflow-auto 
        space-y-6 
        p-4
      "
    >
      <Typography variant="h2">Total Deposit Amount</Typography>

      {isSeller && (
        <div className="flex flex-col space-y-4">
          <Typography variant="h3">
            Summary of Your Selections
          </Typography>

          <div 
            className="
              grid 
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3 
              gap-4
            "
          >
            {/* UID */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                User UID
              </Typography>
              <Input
                type="text"
                readOnly
                value={userUid}
                className="mt-1"
              />
            </div>
            {/* Item Description */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Item / Service
              </Typography>
              <Input
                type="text"
                readOnly
                value={itemDescription || ""}
                className="mt-1"
              />
            </div>
            {/* Service Nature */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Service Nature
              </Typography>
              <Input
                type="text"
                readOnly
                value={serviceNature || ""}
                className="mt-1"
              />
            </div>
            {/* Fee Responsibility */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Fee Responsibility
              </Typography>
              <Input
                type="text"
                readOnly
                value={escrowFeeResponsibility || ""}
                className="mt-1"
              />
            </div>
            {/* Payment Source */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Payment Source
              </Typography>
              <Input
                type="text"
                readOnly
                value={paymentSource || ""}
                className="mt-1"
              />
            </div>
            {/* Price */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Price (USD)
              </Typography>
              <Input
                type="text"
                readOnly
                value={`$${price.toFixed(2)}`}
                className="mt-1"
              />
            </div>
            {/* Escrow Fee */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Escrow Fee
              </Typography>
              <Input
                type="text"
                readOnly
                value={`$${escrowFee.toFixed(2)}`}
                className="mt-1"
              />
            </div>
            {/* Seller's Deposit Required */}
            <div className="flex flex-col">
              <Typography variant="span" className="font-semibold">
                Deposit Required
              </Typography>
              <Input
                type="text"
                readOnly
                value={`$${sellerDeposit.toFixed(2)}`}
                className="mt-1"
              />
            </div>
          </div>

          <Typography variant="p" className="mt-2">
            Since you are selling, the buyer will deposit if the fee is from their payment.
          </Typography>
        </div>
      )}

      {isBuyer && (
        <div>
          <Typography variant="span" className="font-semibold">
            Total Deposit Amount
          </Typography>
          <Input
            type="text"
            readOnly
            value={`$${totalDeposit.toFixed(2)}`}
            className="mt-1"
          />
          <Typography variant="p" className="mt-2">
            As the buyer, you will deposit this amount based on the selected fee responsibility.
          </Typography>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button onClick={handleAction}>
          {isSeller ? "Next" : "Continue"}
        </Button>
      </div>
    </div>
  )
}

export default DepositFlow
