//components/wallet/ActionCard.tsx

/* eslint-disable  */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Smartphone, Bitcoin, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAuth } from "firebase/auth"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, addDoc, collection } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActionCardProps {
  type: "deposit" | "withdraw"
}

export function ActionCard({ type }: ActionCardProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("mpesa")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [cryptoNetwork, setCryptoNetwork] = useState("TRON") // Default to TRON for USDT
  const [netAmount, setNetAmount] = useState("") // Keep this for Mpesa withdrawals
  const [showDialog, setShowDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  // Compute net amount for withdrawals (only for Mpesa)
  useEffect(() => {
    if (type === "withdraw") {
      const amt = Number(amount)
      if (isNaN(amt) || amt <= 0) {
        setNetAmount("")
      } else if (method === "mpesa") {
        setNetAmount((amt - 50).toFixed(2)) // Deduct Mpesa fees
      } else if (method === "crypto") {
        setNetAmount("") // Clear net amount for crypto
      }
    } else {
      setNetAmount("")
    }
  }, [amount, method, type])

  /**
   * Handles form submission for deposits and withdrawals.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero")
      return
    }

    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      toast.error("User not authenticated. Please sign in.")
      return
    }

    // For crypto withdrawals, show preview dialog instead of processing immediately
    if (type === "withdraw" && method === "crypto") {
      setShowPreviewDialog(true)
      return
    }

    // Continue with processing for other types
    await processTransaction(currentUser)
  }

  /**
   * Process the actual transaction after validation and confirmation
   */
  const processTransaction = async (currentUser: any) => {
    setIsProcessing(true)

    // --- Deposit Flow ---
    if (type === "deposit") {
      if (method === "mpesa") {
        await handleMpesaDeposit(currentUser)
      } else if (method === "crypto") {
        await handleCryptoDeposit(currentUser)
      }
    }

    // --- Withdrawal Flow ---
    if (type === "withdraw") {
      if (method === "crypto") {
        await handleCryptoWithdrawal(currentUser)
      } else if (method === "mpesa") {
        await handleMpesaWithdrawal(currentUser)
      }
    }

    // Clear form fields.
    setAmount("")
    setFirstName("")
    setLastName("")
    setPhoneNumber("")
    setWalletAddress("")
    setCryptoNetwork("TRON") // Reset to default network
    setIsProcessing(false)
  }

  /**
   * Handles Mpesa deposits.
   */
  const handleMpesaDeposit = async (currentUser: any) => {
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          email: currentUser.email,
          uid: currentUser.uid,
          amount,
        }),
      })
      const result = await response.json()
      if (response.ok && result.success) {
        toast.success("Deposit successful!")
        // Update user's KES balance.
        const updateResponse = await fetch("/api/user/updateBalance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: currentUser.uid,
            amount: Number(amount),
            currency: "KES",
          }),
        })
        const updateResult = await updateResponse.json()
        if (!updateResponse.ok) {
          toast.error(updateResult.error || "Failed to update balance")
        }
      } else {
        toast.error(result.error || "Deposit failed or canceled")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during deposit")
    }
  }

  /**
   * Handles Crypto deposits.
   */
  const handleCryptoDeposit = async (currentUser: any) => {
    try {
      const response = await fetch("/api/depositCrypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, amount }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        const { depositId, invoice } = result
        if (invoice?.url) {
          toast.success("Invoice created, redirecting to Cryptomus payment page...")
          window.location.href = invoice.url
        } else {
          toast.error("Failed to obtain Cryptomus invoice")
        }
      } else {
        toast.error(result.error || "Failed to create deposit record")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during crypto deposit")
    }
  }

  /**
   * Handles Crypto withdrawals.
   */
  const handleCryptoWithdrawal = async (currentUser: any) => {
    // Validate minimum withdrawal amount
    if (Number(amount) < 9) {
      toast.error("Minimum crypto withdrawal is 10 USD")
      setIsProcessing(false)
      return
    }

    // Validate wallet address and network
    if (!walletAddress || !cryptoNetwork) {
      toast.error("Please provide a valid wallet address and network")
      setIsProcessing(false)
      return
    }

    try {
      // Check user's USD balance
      const balanceRes = await fetch(`/api/user/getWalletBalance?uid=${currentUser.uid}`)
      const balanceData = await balanceRes.json()
      if (!balanceData.success) {
        toast.error("Failed to retrieve wallet balance")
        setIsProcessing(false)
        return
      }

      const availableUSD = Number(balanceData.userUsdBalance || 0)
      if (availableUSD < Number(amount)) {
        toast.error("Withdrawal amount exceeds your available USD balance")
        setIsProcessing(false)
        return
      }

      // Create a withdrawal document in Firestore
      const withdrawalDocRef = await addDoc(collection(db, "withdrawals"), {
        uid: currentUser.uid,
        amount: Number(amount),
        currency: "USD",
        method: "Crypto",
        walletAddress,
        cryptoNetwork,
        status: "pending",
        createdAt: new Date(),
      })
      const orderId = withdrawalDocRef.id

      // Initiate crypto withdrawal with the generated order ID
      const response = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          amount,
          currency: "USD",
          network: cryptoNetwork,
          address: walletAddress,
          orderId: orderId,
        }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Withdrawal initiated successfully!")
        setShowDialog(true)
        setShowPreviewDialog(false)
      } else {
        toast.error(result.error || "Withdrawal failed")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during withdrawal")
    }
  }

  /**
   * Handles Mpesa withdrawals.
   */
  const handleMpesaWithdrawal = async (currentUser: any) => {
    if (Number(amount) < 200) {
      toast.error("Minimum MPESA withdrawal is 200 KES")
      setIsProcessing(false)
      return
    }
    if (!firstName || !lastName || !phoneNumber) {
      toast.error("Please fill in all required Mpesa details")
      setIsProcessing(false)
      return
    }
    const safaricomRegex = /^\+254\d{9}$/
    if (!safaricomRegex.test(phoneNumber)) {
      toast.error("Only Safaricom numbers are accepted for Mpesa withdrawals")
      setIsProcessing(false)
      return
    }

    try {
      // Fetch user data from Firestore
      const userRef = doc(db, "users", currentUser.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        toast.error("User not found in database")
        setIsProcessing(false)
        return
      }

      const userData = userSnap.data()
      const userEmail = userData.email
      if (!userEmail) {
        toast.error("User email is missing in the database")
        setIsProcessing(false)
        return
      }

      // Check user's KES balance
      const availableKES = Number(userData.userKesBalance || 0)
      if (availableKES < Number(amount)) {
        toast.error("Withdrawal amount exceeds your available KES balance")
        setIsProcessing(false)
        return
      }

      // Initiate Mpesa withdrawal
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          amount,
          uid: currentUser.uid,
          email: userEmail,
        }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success("Withdrawal initiated successfully!")
      } else {
        toast.error(result.error || "Withdrawal failed or canceled")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during withdrawal")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-purple-600 dark:border-purple-400">
      <CardHeader>
        <CardTitle className="text-purple-600 dark:text-purple-400">
          {type === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Method</Label>
            <RadioGroup defaultValue="mpesa" onValueChange={setMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="flex items-center">
                  <Smartphone className="mr-2 h-4 w-4" /> M-Pesa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="flex items-center">
                  <Bitcoin className="mr-2 h-4 w-4" /> Crypto (USDT Only)
                </Label>
              </div>
            </RadioGroup>
          </div>
          {/* For Deposits */}
          {type === "deposit" && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({method === "mpesa" ? "KES" : "USD"})</Label>
              <Input
                id="amount"
                placeholder={`Enter amount in ${method === "mpesa" ? "KES" : "USD"}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          )}
          {/* For Withdrawals: Amount field (removed Net Amount for crypto) */}
          {type === "withdraw" && (
            <div
              className={
                method === "mpesa" ? "flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0" : "space-y-2"
              }
            >
              <div className="flex-1">
                <Label htmlFor="amount">Amount ({method === "mpesa" ? "KES" : "USD"})</Label>
                <Input
                  id="amount"
                  placeholder={`Enter amount in ${method === "mpesa" ? "KES" : "USD"}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              {method === "mpesa" && (
                <div className="flex-1">
                  <Label htmlFor="netAmount">Net Amount</Label>
                  <Input id="netAmount" placeholder="Net amount" value={netAmount} readOnly />
                </div>
              )}
            </div>
          )}
          {/* Additional Fields for MPESA (applies for both deposit and withdrawal) */}
          {method === "mpesa" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="Enter your Safaricom phone number (e.g +254...)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Only Safaricom numbers are accepted for Mpesa withdrawals and deposits.
                </p>
              </div>
            </div>
          )}
          {type === "withdraw" && method === "crypto" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">USDT Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="Enter your USDT wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cryptoNetwork">Network</Label>
                  <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                    <SelectTrigger id="cryptoNetwork">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRON">TRON (TRC20)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ERC20)</SelectItem>
                      <SelectItem value="BSC">Binance Smart Chain (BEP20)</SelectItem>
                      <SelectItem value="MATIC">Polygon (MATIC ERC20)</SelectItem>
                      <SelectItem value="ARBITRUM">Arbitrum (ARB ERC20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Warning about wallet address and network selection */}
              <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Important Information:</p>
                  <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                    <li>
                      Double-check your wallet address. Crypto transactions are <strong>irreversible</strong>.
                    </li>
                    <li>Network fees will be deducted from your withdrawal amount by the blockchain network.</li>
                    <li>
                      Arbitrum network typically has lower fees, but it's your responsibility to choose the network that
                      best suits your needs.
                    </li>
                    <li>We are not liable for any commission deductions from the network you choose.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
          <Button type="submit" className="w-full bg-purple-600 hover:bg-orange-500 text-white">
            {isProcessing ? "Processing your request..." : type === "deposit" ? "Deposit" : "Withdraw"}
          </Button>
        </form>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Initiated</DialogTitle>
            <DialogDescription>
              Your withdrawal has been initiated and will be processed within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowDialog(false)} className="bg-purple-600 hover:bg-orange-500 text-white">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog for Crypto Withdrawals */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>Please review your withdrawal details carefully before proceeding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Amount:</div>
              <div>{amount} USD</div>

              <div className="font-medium">Wallet Address:</div>
              <div className="break-all">{walletAddress}</div>

              <div className="font-medium">Network:</div>
              <div>{cryptoNetwork}</div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Network fees will be deducted from your withdrawal amount. The actual amount you receive may be less
                than the amount you're withdrawing.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-orange-500 text-white"
              onClick={() => {
                const auth = getAuth()
                const currentUser = auth.currentUser
                if (currentUser) {
                  processTransaction(currentUser)
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

