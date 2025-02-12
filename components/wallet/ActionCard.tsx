// components/wallet/ActionCard.tsx
/* eslint-disable */
"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Smartphone, Bitcoin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuth } from "firebase/auth"
import { atlosPay, loadAtlosScript } from "@/lib/atlos"

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
  const [cryptoNetwork, setCryptoNetwork] = useState("")
  const [coin, setCoin] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero")
      setIsProcessing(false)
      return
    }

    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser) {
      toast.error("User not authenticated. Please sign in.")
      setIsProcessing(false)
      return
    }

    // --- Deposit Flow ---
    if (type === "deposit") {
      if (method === "mpesa") {
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
      if (method === "crypto") {
        try {
          // Create a crypto deposit record.
          const cryptoDepositRes = await fetch("/api/depositCrypto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: currentUser.uid, amount }),
          })
          const cryptoDepositResult = await cryptoDepositRes.json()
          if (!cryptoDepositRes.ok || !cryptoDepositResult.success) {
            toast.error(cryptoDepositResult.error || "Failed to create deposit record")
            setIsProcessing(false)
            return
          }
          const depositId = cryptoDepositResult.depositId
          loadAtlosScript()
          atlosPay({
            merchantId: process.env.NEXT_PUBLIC_ATLOS_MERCHANT_ID || "",
            orderId: depositId,
            orderAmount: Number(amount),
            onSuccess: async () => {
              // Update deposit status to "paid".
              await fetch("/api/deposit/updateStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ depositId, status: "paid" }),
              })
              // Update user's USD balance.
              const updateResponse = await fetch("/api/user/updateBalance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid: currentUser.uid,
                  amount: Number(amount),
                  currency: "USD",
                }),
              })
              const updateResult = await updateResponse.json()
              if (!updateResponse.ok) {
                toast.error(updateResult.error || "Failed to update balance")
              } else {
                toast.success("Crypto deposit successful!")
              }
              window.location.reload()
            },
            onCanceled: async () => {
              await fetch("/api/deposit/updateStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ depositId, status: "cancelled" }),
              })
              toast.error("Crypto deposit canceled")
              setIsProcessing(false)
            },
            onFailed: async () => {
              await fetch("/api/deposit/updateStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ depositId, status: "failed" }),
              })
              toast.error("Crypto deposit failed")
              setIsProcessing(false)
            },
          })
        } catch (err: any) {
          toast.error(err.message || "An error occurred during crypto deposit")
          setIsProcessing(false)
        }
      }
    }

    // --- Withdrawal Flow ---
    if (type === "withdraw") {
      if (method === "crypto") {
        setShowDialog(true)
        setIsProcessing(false)
        return
      }
      if (method === "mpesa") {
        if (!firstName || !lastName || !phoneNumber) {
          toast.error("Please fill in all required Mpesa details")
          setIsProcessing(false)
          return
        }
        const safaricomRegex = /^\+2547\d{8}$/
        if (!safaricomRegex.test(phoneNumber)) {
          toast.error("Only Safaricom numbers are accepted for Mpesa withdrawals")
          setIsProcessing(false)
          return
        }
        // Check user's KES balance.
        try {
          const balanceRes = await fetch(`/api/user/getWalletBalance?uid=${currentUser.uid}`)
          const balanceData = await balanceRes.json()
          if (!balanceData.success) {
            toast.error("Failed to retrieve wallet balance")
            setIsProcessing(false)
            return
          }
          const availableKES = Number(balanceData.userKesBalance || 0)
          if (availableKES < Number(amount)) {
            toast.error("Withdrawal amount exceeds your available KES balance")
            setIsProcessing(false)
            return
          }
        } catch {
          toast.error("Error checking wallet balance")
          setIsProcessing(false)
          return
        }
        try {
          const response = await fetch("/api/withdrawal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              lastName,
              phoneNumber,
              amount,
              uid: currentUser.uid,
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
        }
      }
    }

    // Clear form fields.
    setAmount("")
    setFirstName("")
    setLastName("")
    setPhoneNumber("")
    setWalletAddress("")
    setCryptoNetwork("")
    setCoin("")
    setIsProcessing(false)
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
                  <Bitcoin className="mr-2 h-4 w-4" /> Crypto
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({method === "mpesa" ? "KES" : "USD"})
            </Label>
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
                  placeholder="Enter your Safaricom phone number"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  placeholder="Enter your wallet address"
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
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="binance">Binance Smart Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coin">Coin</Label>
                <Select value={coin} onValueChange={setCoin}>
                  <SelectTrigger id="coin">
                    <SelectValue placeholder="Select coin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="usdc">USDC</SelectItem>
                    <SelectItem value="busd">BUSD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full bg-purple-600 hover:bg-orange-500 text-white">
            {isProcessing
              ? "Processing your request..."
              : type === "deposit"
              ? "Deposit"
              : "Withdraw"}
          </Button>
        </form>
      </CardContent>
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
    </Card>
  )
}
