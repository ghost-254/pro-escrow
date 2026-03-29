//components/wallet/ActionCard.tsx

/* eslint-disable  */
"use client"

import type React from "react"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { toast } from "react-toastify"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Smartphone, Bitcoin, AlertTriangle, RefreshCw, CircleCheckBig, CircleX } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActionCardProps {
  type: "deposit" | "withdraw"
}

interface MpesaDepositTracker {
  depositId: string
  dialogOpen: boolean
  status: "Pending" | "Completed" | "Failed"
  rawStatus: string
  exactStatus: string
  failureReason: string | null
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
  const [mpesaDepositTracker, setMpesaDepositTracker] = useState<MpesaDepositTracker | null>(null)
  const announcedDepositIdsRef = useRef<Set<string>>(new Set())
  const isMpesaDepositPending = mpesaDepositTracker?.status === "Pending"

  const resetForm = () => {
    setAmount("")
    setFirstName("")
    setLastName("")
    setPhoneNumber("")
    setWalletAddress("")
    setCryptoNetwork("TRON")
  }

  const refreshWalletUi = () => {
    window.dispatchEvent(new Event("wallet:refresh"))
  }

  const handleTrackedMpesaDepositStatus = (
    depositId: string,
    nextStatus: "Pending" | "Completed" | "Failed",
    failureReason: string | null
  ) => {
    if (announcedDepositIdsRef.current.has(depositId) || nextStatus === "Pending") {
      return
    }

    announcedDepositIdsRef.current.add(depositId)
    refreshWalletUi()

    if (nextStatus === "Completed") {
      toast.success("M-Pesa deposit completed and your wallet has been updated.")
      return
    }

    toast.error(failureReason || "M-Pesa deposit failed.")
  }

  useEffect(() => {
    if (!mpesaDepositTracker || mpesaDepositTracker.status !== "Pending") {
      return
    }

    let isCancelled = false

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/deposit/${mpesaDepositTracker.depositId}`, {
          cache: "no-store",
        })
        const result = await response.json()

        if (!response.ok || !result.success || !result.deposit) {
          return
        }

        if (isCancelled) {
          return
        }

        const nextTracker: MpesaDepositTracker = {
          depositId: result.deposit.id,
          dialogOpen: true,
          status: result.deposit.status,
          rawStatus: result.deposit.rawStatus,
          exactStatus: result.deposit.exactStatus || result.deposit.rawStatus || result.deposit.status,
          failureReason: result.deposit.failureReason || null,
        }

        setMpesaDepositTracker((currentTracker) => ({
          ...nextTracker,
          dialogOpen: currentTracker?.dialogOpen ?? true,
        }))

        handleTrackedMpesaDepositStatus(
          result.deposit.id,
          result.deposit.status,
          result.deposit.failureReason || null
        )
      } catch {
        // Keep polling in the background; transient network failures should not stop the tracker.
      }
    }

    void pollStatus()
    const intervalId = window.setInterval(() => {
      void pollStatus()
    }, 5000)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [mpesaDepositTracker?.depositId, mpesaDepositTracker?.status])

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
    if (!auth.currentUser) {
      toast.error("User not authenticated. Please sign in.")
      return
    }

    // For crypto withdrawals, show preview dialog instead of processing immediately
    if (type === "withdraw" && method === "crypto") {
      setShowPreviewDialog(true)
      return
    }

    // Continue with processing for other types
    await processTransaction()
  }

  /**
   * Process the actual transaction after validation and confirmation
   */
  const processTransaction = async () => {
    setIsProcessing(true)
    let wasSuccessful = false

    try {
      if (type === "deposit") {
        if (method === "mpesa") {
          wasSuccessful = await handleMpesaDeposit()
        } else if (method === "crypto") {
          wasSuccessful = await handleCryptoDeposit()
        }
      }

      if (type === "withdraw") {
        if (method === "crypto") {
          wasSuccessful = await handleCryptoWithdrawal()
        } else if (method === "mpesa") {
          wasSuccessful = await handleMpesaWithdrawal()
        }
      }
    } finally {
      if (wasSuccessful) {
        resetForm()
      }
      setIsProcessing(false)
    }
  }

  /**
   * Handles Mpesa deposits.
   */
  const handleMpesaDeposit = async () => {
    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          amount,
        }),
      })
      const responseText = await response.text()
      const result = responseText
        ? (() => {
            try {
              return JSON.parse(responseText) as Record<string, any>
            } catch {
              return {
                success: false,
                error: responseText.trim().startsWith("<")
                  ? "We could not start your M-Pesa payment right now. Please try again."
                  : responseText.trim() || "We could not start your M-Pesa payment right now.",
              }
            }
          })()
        : { success: false, error: "We could not start your M-Pesa payment right now." }

      if (response.ok && result.success) {
        if (result.depositId) {
          setMpesaDepositTracker({
            depositId: result.depositId,
            dialogOpen: true,
            status: "Pending",
            rawStatus: result.status || "pending",
            exactStatus: result.status || "pending",
            failureReason: null,
          })
        }

        toast.success(
          result.status === "pending"
            ? result.message || "STK push sent. Approve the payment on your phone."
            : "Deposit successful!"
        )
        return true
      } else {
        toast.error(result.error || "We could not start your M-Pesa payment.")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during deposit")
    }

    return false
  }

  /**
   * Handles Crypto deposits.
   */
  const handleCryptoDeposit = async () => {
    try {
      const response = await fetch("/api/depositCrypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        const { invoice } = result
        if (invoice?.url) {
          toast.success("Invoice created, redirecting to Cryptomus payment page...")
          window.location.href = invoice.url
          return true
        } else {
          toast.error("Failed to obtain Cryptomus invoice")
        }
      } else {
        toast.error(result.error || "Failed to create deposit record")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during crypto deposit")
    }

    return false
  }

  /**
   * Handles Crypto withdrawals.
   */
  const handleCryptoWithdrawal = async () => {
    // Validate minimum withdrawal amount
    if (Number(amount) < 10) {
      toast.error("Minimum crypto withdrawal is 10 USD")
      return false
    }

    // Validate wallet address and network
    if (!walletAddress || !cryptoNetwork) {
      toast.error("Please provide a valid wallet address and network")
      return false
    }

    try {
      // Check user's USD balance
      const balanceRes = await fetch("/api/user/getWalletBalance")
      const balanceData = await balanceRes.json()
      if (!balanceData.success) {
        toast.error("Failed to retrieve wallet balance")
        return false
      }

      const availableUSD = Number(balanceData.userUsdBalance || 0)
      if (availableUSD < Number(amount)) {
        toast.error("Withdrawal amount exceeds your available USD balance")
        return false
      }

      // Initiate crypto withdrawal
      const response = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          network: cryptoNetwork,
          address: walletAddress,
        }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(
          result.status === "processing"
            ? "Withdrawal initiated. We will update the status once the provider confirms it."
            : "Withdrawal initiated successfully!"
        )
        setShowDialog(true)
        setShowPreviewDialog(false)
        return true
      } else {
        toast.error(result.error || "Withdrawal failed")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during withdrawal")
    }

    return false
  }

  /**
   * Handles Mpesa withdrawals.
   */
  const handleMpesaWithdrawal = async () => {
    if (Number(amount) < 200) {
      toast.error("Minimum MPESA withdrawal is 200 KES")
      return false
    }
    if (!firstName || !lastName || !phoneNumber) {
      toast.error("Please fill in all required Mpesa details")
      return false
    }
    const kenyanPhoneRegex = /^(\+254|254|0)\d{9}$/
    if (!kenyanPhoneRegex.test(phoneNumber.replace(/\s+/g, ""))) {
      toast.error("Enter a valid Kenyan mobile number.")
      return false
    }

    try {
      const balanceRes = await fetch("/api/user/getWalletBalance")
      const balanceData = await balanceRes.json()
      if (!balanceData.success) {
        toast.error("Failed to retrieve wallet balance")
        return false
      }

      const availableKES = Number(balanceData.userKesBalance || 0)
      if (availableKES < Number(amount)) {
        toast.error("Withdrawal amount exceeds your available KES balance")
        return false
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
        }),
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success(
          result.status === "processing"
            ? "Withdrawal initiated. We will notify you once it is completed."
            : "Withdrawal initiated successfully!"
        )
        return true
      } else {
        toast.error(result.error || "Withdrawal failed or canceled")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during withdrawal")
    }

    return false
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
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-orange-500 text-white"
            disabled={isProcessing}
          >
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
                  processTransaction()
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(mpesaDepositTracker?.dialogOpen)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isMpesaDepositPending) {
            return
          }

          setMpesaDepositTracker((currentTracker) =>
            currentTracker
              ? {
                  ...currentTracker,
                  dialogOpen: nextOpen,
                }
              : currentTracker
          )
        }}
      >
        <DialogContent
          className="sm:max-w-md overflow-hidden border-0 bg-white p-0 text-center shadow-2xl"
          showClose={!isMpesaDepositPending}
          onEscapeKeyDown={(event) => {
            if (isMpesaDepositPending) {
              event.preventDefault()
            }
          }}
          onPointerDownOutside={(event) => {
            if (isMpesaDepositPending) {
              event.preventDefault()
            }
          }}
          onInteractOutside={(event) => {
            if (isMpesaDepositPending) {
              event.preventDefault()
            }
          }}
        >
          <div className="bg-gradient-to-br from-[#00A651] via-[#06B85A] to-[#0D6B3A] px-6 py-6 text-white">
            <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-white/14 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Image src="/mpesa-logo.png" alt="M-Pesa" width={32} height={32} className="h-8 w-8 object-contain" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.22em] text-white/75">Mobile Money</p>
                <p className="text-base font-semibold">M-Pesa Payment Status</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">
          <DialogHeader>
            <DialogTitle>M-Pesa Payment Status</DialogTitle>
            <DialogDescription>
              We are confirming your payment. Your wallet will update automatically once the payment is completed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-5">
            {mpesaDepositTracker?.status === "Pending" ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : mpesaDepositTracker?.status === "Completed" ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CircleCheckBig className="h-8 w-8 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <CircleX className="h-8 w-8 text-red-600" />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">{mpesaDepositTracker?.status || "Pending"}</p>
              <p className="text-sm leading-6 text-slate-600">
                {mpesaDepositTracker?.status === "Pending"
                  ? "Please complete the prompt on your phone if you have not done so already. Confirmation usually takes a few seconds."
                  : mpesaDepositTracker?.status === "Completed"
                    ? "Your payment has been confirmed and your wallet balance has been updated."
                    : mpesaDepositTracker?.failureReason || "We could not confirm this payment. If funds were deducted, please contact support with your payment details."}
              </p>
              {mpesaDepositTracker?.exactStatus && (
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  M-Pesa status: {mpesaDepositTracker.exactStatus}
                </p>
              )}
              {mpesaDepositTracker?.depositId && (
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Reference {mpesaDepositTracker.depositId.slice(0, 8).toUpperCase()}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {mpesaDepositTracker?.status !== "Pending" ? (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setMpesaDepositTracker(null)}
              >
                Close
              </Button>
            ) : null}
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

