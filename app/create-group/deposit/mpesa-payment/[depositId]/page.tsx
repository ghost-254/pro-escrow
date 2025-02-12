//app/create-group/deposit/mpesa-payment/[depositId]/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebaseConfig"
import useTransaction from "hooks/useTransaction"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Define the deposit structure as captured from the deposit page.
interface Deposit {
  id: string
  transactionType: string
  itemDescription: string
  price: number
  escrowFee: number
  escrowFeeResponsibility: "seller" | "50/50" | "buyer"
  userId: string
  depositMethod: string
  groupId?: string
}

// Zod form schema.
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  amount: z.number().min(1, "Amount must be greater than 0"),
})

// Calculates the final deposit amount based on fee responsibility.
function calcDepositAmount(deposit: Deposit): number {
  const { escrowFeeResponsibility, price, escrowFee } = deposit
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

export default function MpesaPaymentPage() {
  const router = useRouter()
  const { depositId } = useParams() as { depositId: string }
  const { processDepositTransaction } = useTransaction()

  const [depositData, setDepositData] = useState<Deposit | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      amount: 0, // will be updated after deposit data is fetched
    },
  })

  // Load the deposit document.
  useEffect(() => {
    async function fetchDeposit() {
      if (!depositId) {
        toast.error("Invalid deposit ID.")
        router.push("/")
        return
      }
      try {
        const ref = doc(db, "deposits", depositId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          toast.error("Deposit not found.")
          router.push("/")
          return
        }
        setDepositData({ id: snap.id, ...(snap.data() as Omit<Deposit, "id">) })
      } catch {
        toast.error("Error fetching deposit.")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDeposit()
  }, [depositId, router])

  // Once depositData is loaded, update the form's "amount" field with the final deposit amount.
  useEffect(() => {
    if (depositData) {
      form.setValue("amount", calcDepositAmount(depositData))
    }
  }, [depositData, form])

  // Creates the group, links the deposit, posts a notification, and redirects.
  async function createGroupAndRedirect(
    deposit: Deposit,
    newStatus: string
  ): Promise<void> {
    const depositRef = doc(db, "deposits", deposit.id)
    await updateDoc(depositRef, { status: newStatus })

    const groupData = {
      depositId: deposit.id,
      participants: [deposit.userId],
      status: newStatus,
      createdAt: Timestamp.now(),
      transactionDetails: {
        price: deposit.price,
        escrowFee: deposit.escrowFee,
        transactionType: deposit.transactionType,
        itemDescription: deposit.itemDescription,
      },
    }
    const groupRef = await addDoc(collection(db, "groups"), groupData)
    await updateDoc(depositRef, { groupId: groupRef.id })

    const shortGroupName = `Xcrow_${groupRef.id.slice(0, 4)}`
    await addDoc(collection(db, "notifications"), {
      userId: deposit.userId,
      message: `You created a new ${shortGroupName} group. Please share this link with the seller.`,
      link: `/group-chat/${groupRef.id}`,
      read: false,
      createdAt: Timestamp.now(),
    })

    router.push(`/group-chat/${groupRef.id}`)
  }

  // Handles the M-Pesa payment process.
  async function handlePayment(data: z.infer<typeof formSchema>) {
    if (!depositData) {
      toast.error("No deposit data loaded.")
      return
    }
    setIsLoading(true)
    const finalAmount = calcDepositAmount(depositData)
    try {
      const response = await fetch(`/api/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, amount: finalAmount }),
      })
      const result = await response.json()
      const newStatus = result.success ? "paid" : "failed"
      if (result.success) {
        toast.success("Payment successful!")
      } else {
        toast.error("Payment failed or canceled.")
      }

      await processDepositTransaction(
        depositData.userId,
        depositData.price,
        {
          paymentMethod: depositData.depositMethod || "M-Pesa",
          paymentDetails: "",
        },
        depositData.escrowFee,
        newStatus === "paid" ? "Completed" : "Failed",
        depositData.transactionType
      )

      await createGroupAndRedirect(depositData, newStatus)
    } catch {
      toast.error("Error processing payment.")
      await createGroupAndRedirect(depositData, "failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-4">Loading deposit info...</div>
  if (!depositData) return <div className="p-4">No deposit data found.</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-purple-600 dark:from-emerald-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 bg-emerald-600 dark:bg-emerald-800">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-white">M-Pesa Payment</h1>
          <div className="w-10" />
        </div>
        <div className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePayment)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="2547XXXXXXXX"
                          {...field}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                        Enter a valid Kenyan phone number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="johndoe@example.com"
                          {...field}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200">
                        Amount (KES)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          readOnly
                          className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Send M-Pesa Request"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
