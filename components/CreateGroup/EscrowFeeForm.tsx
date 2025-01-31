import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import {
  setEscrowFee,
  setEscrowFeeResponsibility,
  setPaymentSource,
  nextStep,
  previousStep,
  setChargeFeeFromBuyerPayment,
} from "@/lib/slices/groupCreationSlice"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import Typography from "@/components/ui/typography"

/** 
 * Returns the escrow fee based on Xcrow's tiered structure:
 * 
 * 0 - 5    => $0
 * 6 - 10   => $1
 * 11 - 50  => $3
 * 51 - 80  => $5
 * 81 - 200 => $10
 * 201 - 500 => $20
 * 501 - 1000 => $50
 * 1001 - 2000 => $100
 * Above 2000 => 5% of amount
 */
function calculateEscrowFee(price: number): number {
  if (price <= 5) return 0
  else if (price <= 10) return 1
  else if (price <= 50) return 3
  else if (price <= 80) return 5
  else if (price <= 200) return 10
  else if (price <= 500) return 20
  else if (price <= 1000) return 50
  else if (price <= 2000) return 100
  else return price * 0.05
}

const EscrowFeeForm = () => {
  const dispatch = useDispatch()

  const {
    escrowFee,
    escrowFeeResponsibility,
    paymentSource,
    chargeFeeFromBuyerPayment,
    transactionType,
    price,
  } = useSelector((state: RootState) => state.groupCreation)

  // Whenever price changes, recalc the escrow fee and store in Redux
  useEffect(() => {
    const fee = calculateEscrowFee(price)
    dispatch(setEscrowFee(fee))
  }, [price, dispatch])

  const handleNext = () => {
    if (!escrowFeeResponsibility) {
      alert("Please select who will cover the escrow fee.")
      return
    }
    if (!paymentSource.trim()) {
      alert("Please specify the payment source for the escrow fee.")
      return
    }
    dispatch(nextStep())
  }

  return (
    <div>
      <Typography variant="h3" className="mb-4">
        Escrow Fee Details
      </Typography>

      <div className="space-y-4">
        {/* Display tiered fee, ignoring the old 1.5% text */}
        <div>
          <Typography variant="span" className="font-semibold">
            Escrow Fee
          </Typography>
          <Input
            type="text"
            value={`$${escrowFee.toFixed(2)}`}
            readOnly
            className="mt-1"
          />
        </div>

        {/* Escrow Fee Responsibility */}
        <div>
          <Typography variant="span" className="font-semibold">
            Who Pays Escrow Fee?
          </Typography>
          <RadioGroup
            value={escrowFeeResponsibility ?? ""}
            onValueChange={(value: "buyer" | "seller" | "50/50") =>
              dispatch(setEscrowFeeResponsibility(value))
            }
            className="flex flex-col space-y-2 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buyer" id="buyer" />
              <label htmlFor="buyer" className="cursor-pointer">
                Buyer
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="seller" id="seller" />
              <label htmlFor="seller" className="cursor-pointer">
                Seller
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="50/50" id="50-50" />
              <label htmlFor="50-50" className="cursor-pointer">
                50/50
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Source */}
        <div>
          <Typography variant="span" className="font-semibold">
            Preferred Payment Method
          </Typography>
          <Input
            type="text"
            placeholder="Specify payment method (e.g., Mpesa, AirTM, Binance, Crypto Wallet Address)"
            value={paymentSource}
            onChange={(e) => dispatch(setPaymentSource(e.target.value))}
            className="mt-1"
          />
        </div>

        {/* Seller-Specific Flow */}
        {transactionType === "selling" && (
          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chargeFeeFromBuyerPayment}
                onChange={(e) => dispatch(setChargeFeeFromBuyerPayment(e.target.checked))}
              />
              <span>Charge Xcrow Fee from Buyer's Payment</span>
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default EscrowFeeForm
