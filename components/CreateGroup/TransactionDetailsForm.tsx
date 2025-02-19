// components/CreateGroup/TransactionDetailsForm.tsx

/* eslint-disable */

"use client"

import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"
import {
  setItemDescription,
  setPrice,
  setServiceNature,
  setCurrency,
  setEscrowFee,
  setEscrowFeeResponsibility,
  nextStep,
  previousStep,
} from "@/lib/slices/groupCreationSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Typography from "@/components/ui/typography"
import { toast } from "react-toastify"

// --- Escrow Fee Calculation Functions ---
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

const TransactionDetailsForm = () => {
  const dispatch = useDispatch()
  const {
    itemDescription,
    price,
    serviceNature,
    currency,
    transactionType,
    escrowFee,
    escrowFeeResponsibility,
  } = useSelector((state: RootState) => state.groupCreation)
  const user = useSelector((state: RootState) => state.auth.user)

  // Local state for buyer wallet balances and selection
  const [userUsdBalance, setUserUsdBalance] = useState<number>(0)
  const [userKesBalance, setUserKesBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string>("")

  // For buyers, fetch wallet balances
  useEffect(() => {
    if (!user || transactionType === "selling") return
    const fetchBalances = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/user/getWalletBalance?uid=${user.uid}`)
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch wallet balances.")
        }
        setUserUsdBalance(data.userUsdBalance || 0)
        setUserKesBalance(data.userKesBalance || 0)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBalances()
  }, [user?.uid, transactionType])

  // Recalculate escrow fee when price or currency changes
  useEffect(() => {
    let fee = 0
    if (currency === "KES") {
      fee = calculateEscrowFeeKES(price)
    } else {
      fee = calculateEscrowFeeUSD(price)
    }
    dispatch(setEscrowFee(fee))
  }, [price, currency, dispatch])

  // For buyers, total payable depends on who pays the escrow fee:
  // - Buyer: total = price + escrowFee
  // - 50/50: total = price + escrowFee/2
  // - Seller: total = price
  const getTotalPayment = (): number => {
    if (transactionType !== "selling") {
      if (escrowFeeResponsibility === "buyer") return price + escrowFee
      if (escrowFeeResponsibility === "50/50") return price + escrowFee / 2
      return price
    }
    return price
  }

  // Handle wallet selection for buyers
  const handleCardSelect = (curr: "USD" | "KES") => {
    setSelectedCurrency(curr)
    dispatch(setCurrency(curr))
  }

  // Handle Next button click; validate fields and wallet balance if buyer
  const handleNext = () => {
    // Basic field checks:
    if (!itemDescription.trim() || !price || !serviceNature.trim()) {
      toast.error("Please fill in all fields.")
      return
    }

    // Ensure escrowFeeResponsibility is chosen (non-empty)
    if (!escrowFeeResponsibility) {
      toast.error("Please select who pays the escrow fee.")
      return
    }

    if (transactionType !== "selling") {
      // We are in "buying" or other scenario where we must check the buyer's wallet
      if (!selectedCurrency) {
        toast.error("Please select a wallet currency.")
        return
      }
      const walletBalance = selectedCurrency === "USD" ? userUsdBalance : userKesBalance
      if (walletBalance === 0) {
        toast.error(`Your selected ${selectedCurrency} wallet balance is zero. Please fund your wallet.`)
        return
      }
      const total = getTotalPayment()
      if (total > walletBalance) {
        toast.error(
          `Insufficient ${selectedCurrency} balance. Your wallet balance is ${
            selectedCurrency === "USD"
              ? `$${userUsdBalance.toFixed(2)}`
              : `KES ${userKesBalance.toFixed(2)}`
          }, but total required is ${
            selectedCurrency === "USD" ? `$${total.toFixed(2)}` : `KES ${total.toFixed(2)}`
          }.`
        )
        return
      }
    } else {
      // We are in "selling" scenario; confirm that a currency is set
      if (!currency) {
        toast.error("Please select a currency for your price.")
        return
      }
    }

    // If all checks pass, move to the next step
    dispatch(nextStep())
  }

  return (
    <div className="space-y-6">
      <Typography variant="h3" className="mb-4">
        Transaction Details {transactionType === "selling" ? "(Seller)" : "& Wallet Verification (Buyer)"}
      </Typography>

      {transactionType !== "selling" ? (
        // Buyer interface: Wallet selection
        <div className="mt-6">
          <Typography variant="h4" className="mb-2">Select Wallet for Payment</Typography>
          {loading ? (
            <Typography variant="p">Loading wallet balances...</Typography>
          ) : error ? (
            <Typography variant="p" className="text-red-600">{error}</Typography>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                onClick={() => handleCardSelect("USD")}
                className={`cursor-pointer transition-colors p-2 ${
                  selectedCurrency === "USD"
                    ? "border-2 border-orange-600"
                    : "border border-gray-200"
                } hover:border-orange-600`}
              >
                <CardHeader>
                  <CardTitle>USD Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="h2">${userUsdBalance.toFixed(2)}</Typography>
                </CardContent>
              </Card>
              <Card
                onClick={() => handleCardSelect("KES")}
                className={`cursor-pointer transition-colors p-2 ${
                  selectedCurrency === "KES"
                    ? "border-2 border-orange-600"
                    : "border border-gray-200"
                } hover:border-orange-600`}
              >
                <CardHeader>
                  <CardTitle>KES Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="h2">KES {userKesBalance.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        // Seller interface: choose currency & escrow fee responsibility
        <div className="mt-6 space-y-4">
          <div>
            <Typography variant="h4" className="mb-2">Select Currency for Price</Typography>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sellerCurrency"
                  value="USD"
                  checked={currency === "USD"}
                  onChange={(e) => dispatch(setCurrency(e.target.value))}
                />
                <span className="ml-2">USD</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sellerCurrency"
                  value="KES"
                  checked={currency === "KES"}
                  onChange={(e) => dispatch(setCurrency(e.target.value))}
                />
                <span className="ml-2">KES</span>
              </label>
            </div>
          </div>
          <div>
            <Typography variant="h4" className="mb-2">Escrow Fee Responsibility</Typography>
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="escrowFeeResponsibility"
                  value="buyer"
                  checked={escrowFeeResponsibility === "buyer"}
                  onChange={(e) =>
                    dispatch(setEscrowFeeResponsibility(
                      e.target.value as "buyer" | "seller" | "50/50"
                    ))
                  }
                />
                <span>Buyer</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="escrowFeeResponsibility"
                  value="seller"
                  checked={escrowFeeResponsibility === "seller"}
                  onChange={(e) =>
                    dispatch(setEscrowFeeResponsibility(
                      e.target.value as "buyer" | "seller" | "50/50"
                    ))
                  }
                />
                <span>Seller</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="escrowFeeResponsibility"
                  value="50/50"
                  checked={escrowFeeResponsibility === "50/50"}
                  onChange={(e) =>
                    dispatch(setEscrowFeeResponsibility(
                      e.target.value as "buyer" | "seller" | "50/50"
                    ))
                  }
                />
                <span>50/50</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Inputs */}
      <div className="space-y-4">
        <div>
          <Typography variant="span" className="font-semibold">Item/Service Description</Typography>
          <Input
            type="text"
            placeholder="What are you buying or selling?"
            value={itemDescription}
            onChange={(e) => dispatch(setItemDescription(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Typography variant="span" className="font-semibold">
            Price ({selectedCurrency || currency || "Currency"})
          </Typography>
          <Input
            type="number"
            placeholder="Enter price (excluding fees)"
            value={price || ""}
            onChange={(e) => dispatch(setPrice(parseFloat(e.target.value)))}
            className="mt-1"
            min={0}
          />
        </div>
        <div>
          <Typography variant="span" className="font-semibold">Nature of the Service</Typography>
          <Input
            type="text"
            placeholder="Provide a brief description of the service"
            value={serviceNature}
            onChange={(e) => dispatch(setServiceNature(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      {/* For Sellers: Summary of Entered Details */}
      {transactionType === "selling" && (
        <div className="mt-6">
          <Card className="p-4">
            <Typography variant="h4" className="mb-2">Summary of Your Details</Typography>
            <div className="space-y-2">
              <Typography variant="p">
                <strong>Item:</strong> {itemDescription}
              </Typography>
              <Typography variant="p">
                <strong>Price:</strong>{" "}
                {currency === "KES"
                  ? `KES ${price.toFixed(2)}`
                  : `$${price.toFixed(2)}`}
              </Typography>
              <Typography variant="p">
                <strong>Service:</strong> {serviceNature}
              </Typography>
              <Typography variant="p">
                <strong>Escrow Fee Responsibility:</strong> {escrowFeeResponsibility}
              </Typography>
            </div>
          </Card>
        </div>
      )}

      {/* For Buyers: Escrow Fee Calculation Section */}
      {transactionType !== "selling" && (
        <div className="mt-6">
          <Card className="p-4">
            <div className="mt-4">
              <Typography variant="span" className="font-semibold">Who Pays Escrow Fee?</Typography>
              <div className="mt-1 flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="escrowFeeResponsibility"
                    value="buyer"
                    checked={escrowFeeResponsibility === "buyer"}
                    onChange={(e) =>
                      dispatch(setEscrowFeeResponsibility(
                        e.target.value as "buyer" | "seller" | "50/50"
                      ))
                    }
                  />
                  <span>Buyer</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="escrowFeeResponsibility"
                    value="seller"
                    checked={escrowFeeResponsibility === "seller"}
                    onChange={(e) =>
                      dispatch(setEscrowFeeResponsibility(
                        e.target.value as "buyer" | "seller" | "50/50"
                      ))
                    }
                  />
                  <span>Seller</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="escrowFeeResponsibility"
                    value="50/50"
                    checked={escrowFeeResponsibility === "50/50"}
                    onChange={(e) =>
                      dispatch(setEscrowFeeResponsibility(
                        e.target.value as "buyer" | "seller" | "50/50"
                      ))
                    }
                  />
                  <span>50/50</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col mt-4 lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
              <div className="flex-1">
                <Typography variant="span" className="font-semibold">Escrow Fee:</Typography>
                <Input
                  type="text"
                  value={
                    currency === "KES"
                      ? `KES ${escrowFee.toFixed(2)}`
                      : `$${escrowFee.toFixed(2)}`
                  }
                  readOnly
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Typography variant="span" className="font-semibold">Total Net Amount:</Typography>
                <Input
                  type="text"
                  value={
                    currency === "KES"
                      ? `KES ${getTotalPayment().toFixed(2)}`
                      : `$${getTotalPayment().toFixed(2)}`
                  }
                  readOnly
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => dispatch(previousStep())}>
          Back
        </Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

export default TransactionDetailsForm
