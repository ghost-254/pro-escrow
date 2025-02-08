"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Typography from "@/components/ui/typography"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { toast } from "react-toastify"
import { Wallet, Bitcoin } from "lucide-react"
import { FaEthereum } from "react-icons/fa"
import { SiBnbchain, SiTether } from "react-icons/si"

export default function DepositPage() {
  const router = useRouter()

  const {
    transactionType,
    itemDescription,
    price,
    escrowFee,
    serviceNature,
    escrowFeeResponsibility,
    paymentSource,
    chargeFeeFromBuyerPayment,
    currency, // get currency from Redux state
  } = useSelector((state: RootState) => state.groupCreation)
  const user = useSelector((state: RootState) => state.auth.user)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")

  // Determine the currency symbol based on the currency state
  const currencySymbol = currency === "KES" ? "KES" : "$"

  // Mock wallet balance - replace with actual balance fetch. Assume it's in the same currency.
  const walletBalance = 1000

  useEffect(() => {
    if (!user?.uid) {
      toast.error("You must be logged in to deposit.")
      router.push("/")
      return
    }
    if (transactionType !== "buying") {
      toast.warn("Only buyers can deposit. Redirecting...")
      router.push("/")
      return
    }
  }, [user, transactionType, router])

  function calculateBuyerDeposit(): number {
    switch (escrowFeeResponsibility) {
      case "seller":
        return price
      case "50/50":
        return price + escrowFee / 2
      case "buyer":
      default:
        return price + escrowFee
    }
  }
  const totalDeposit = calculateBuyerDeposit()

  async function handleProceedToPayment() {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method.")
      return
    }

    setIsSubmitting(true)
    try {
      const depositData = {
        userId: user?.uid,
        transactionType,
        itemDescription,
        price,
        escrowFee,
        serviceNature,
        escrowFeeResponsibility,
        paymentSource,
        chargeFeeFromBuyerPayment,
        depositMethod: selectedPaymentMethod,
        status: "pending",
        createdAt: Timestamp.now(),
        currency, // include currency if desired
      }

      const depositRef = await addDoc(collection(db, "deposits"), depositData)
      const depositId = depositRef.id

      // Redirect based on selected payment method
      switch (selectedPaymentMethod) {
        case "Wallet Balance":
          router.push(`/create-group/deposit/wallet-payment/${depositId}`)
          break
        case "M-Pesa":
          router.push(`/create-group/deposit/mpesa-payment/${depositId}`)
          break
        case "Crypto (Atlos)":
          router.push(`/create-group/deposit/atlos-checkout/${depositId}`)
          break
        default:
          toast.error("Invalid payment method selected.")
      }
    } catch {
      toast.error("Failed to initiate deposit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-2xl font-bold">Deposit to Xcrow</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-6">
            <Typography variant="p">
              You will be paying <strong>{currencySymbol}{totalDeposit.toFixed(2)}</strong>. Please select your preferred payment method:
            </Typography>

            <RadioGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <RadioGroupItem
                  value="Wallet Balance"
                  id="wallet"
                  className="peer sr-only"
                  onClick={() => setSelectedPaymentMethod("Wallet Balance")}
                />
                <Label
                  htmlFor="wallet"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full"
                >
                  <Wallet className="mb-3 h-12 w-12 text-blue-500" />
                  <span className="text-lg font-semibold mb-2">Wallet Balance</span>
                  <span className="text-sm font-semibold">{currencySymbol}{walletBalance.toFixed(2)}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="M-Pesa"
                  id="mpesa"
                  className="peer sr-only"
                  onClick={() => setSelectedPaymentMethod("M-Pesa")}
                />
                <Label
                  htmlFor="mpesa"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full"
                >
                  <Image src="/mpesa-logo.png" alt="M-Pesa" width={80} height={80} className="mb-3" />
                  <span className="text-lg font-semibold mb-1">M-Pesa</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Available in Kenya Only</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="Crypto (Atlos)"
                  id="atlos"
                  className="peer sr-only"
                  onClick={() => setSelectedPaymentMethod("Crypto (Atlos)")}
                />
                <Label
                  htmlFor="atlos"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-full"
                >
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      <FaEthereum className="w-6 h-6 mr-0 text-green-500" />
                      <Bitcoin className="w-6 h-6 ml-0 text-yellow-500" />
                      <SiTether className="w-6 h-6 ml-2 mr-2 text-purple-500 fill-current" />
                      <SiBnbchain className="w-6 h-6 mr-2 text-yellow-500" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      +70
                      <br />
                      crypto
                    </span>
                  </div>
                  <span className="text-lg font-semibold mb-2">Crypto</span>
                </Label>
              </div>
            </RadioGroup>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <strong>Type:</strong>
                  </p>
                  <p>{transactionType}</p>
                  <p>
                    <strong>Description:</strong>
                  </p>
                  <p>{itemDescription}</p>
                  <p>
                    <strong>Price:</strong>
                  </p>
                  <p>{currencySymbol}{price.toFixed(2)}</p>
                  <p>
                    <strong>Escrow Fee:</strong>
                  </p>
                  <p>{currencySymbol}{escrowFee.toFixed(2)}</p>
                  <p>
                    <strong>Responsibility:</strong>
                  </p>
                  <p>{escrowFeeResponsibility}</p>
                  <p>
                    <strong>Deposit Amount:</strong>
                  </p>
                  <p>{currencySymbol}{totalDeposit.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <div className="flex justify-between p-6 border-t">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={handleProceedToPayment} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
