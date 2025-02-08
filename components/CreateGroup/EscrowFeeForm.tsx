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
 * Calculates the escrow fee in USD using Xcrow's tiered structure:
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
function calculateEscrowFeeUSD(price: number): number {
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

/** 
 * Calculates the escrow fee in KES.
 * Assumes a conversion rate of 1 USD = 120 KES.
 * Thresholds are scaled by the conversion rate:
 *
 * 0 - 600      => 0 KES  
 * 601 - 1200   => 120 KES  
 * 1201 - 6000  => 360 KES  
 * 6001 - 9600  => 600 KES  
 * 9601 - 24000 => 1200 KES  
 * 24001 - 60000 => 2400 KES  
 * 60001 - 120000 => 6000 KES  
 * 120001 - 240000 => 12000 KES  
 * Above 240000 => 5% of amount (in KES)
 */
function calculateEscrowFeeKES(price: number): number {
  const conversionRate = 120
  if (price <= 5 * conversionRate) return 0
  else if (price <= 10 * conversionRate) return 1 * conversionRate
  else if (price <= 50 * conversionRate) return 3 * conversionRate
  else if (price <= 80 * conversionRate) return 5 * conversionRate
  else if (price <= 200 * conversionRate) return 10 * conversionRate
  else if (price <= 500 * conversionRate) return 20 * conversionRate
  else if (price <= 1000 * conversionRate) return 50 * conversionRate
  else if (price <= 2000 * conversionRate) return 100 * conversionRate
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
    currency,
  } = useSelector((state: RootState) => state.groupCreation)

  // Recalculate escrow fee whenever price or currency changes
  useEffect(() => {
    let fee = 0
    if (currency === "KES") {
      fee = calculateEscrowFeeKES(price)
    } else {
      fee = calculateEscrowFeeUSD(price)
    }
    dispatch(setEscrowFee(fee))
  }, [price, currency, dispatch])

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
        {/* Display the calculated escrow fee with the appropriate currency symbol */}
        <div>
          <Typography variant="span" className="font-semibold">
            Escrow Fee
          </Typography>
          <Input
            type="text"
            value={
              currency === "KES"
                ? `KES${escrowFee.toFixed(2)}`
                : `$${escrowFee.toFixed(2)}`
            }
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

        {/* Seller-Specific Option */}
        {transactionType === "selling" && (
          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chargeFeeFromBuyerPayment}
                onChange={(e) =>
                  dispatch(setChargeFeeFromBuyerPayment(e.target.checked))
                }
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
