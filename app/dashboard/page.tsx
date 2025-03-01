//app/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/stores/store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ArrowRight,
  DollarSign,
  Users,
  MessageCircle,
  Check,
} from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from 'next/image'

// Helper functions
function formatCurrency(amount: number, currency: "USD" | "KES"): string {
  return currency === "USD"
    ? `$${amount.toFixed(2)}`
    : `KES ${amount.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
}

function calculateFee(amount: number, currency: "USD" | "KES"): number {
  const conversionRate = 130
  const amountUSD = currency === "USD" ? amount : amount / conversionRate

  if (amountUSD <= 5) return 0
  if (amountUSD <= 10) return currency === "USD" ? 1 : 1 * conversionRate
  if (amountUSD <= 50) return currency === "USD" ? 3 : 3 * conversionRate
  if (amountUSD <= 80) return currency === "USD" ? 5 : 5 * conversionRate
  if (amountUSD <= 200) return currency === "USD" ? 10 : 10 * conversionRate
  if (amountUSD <= 500) return currency === "USD" ? 20 : 20 * conversionRate
  if (amountUSD <= 1000) return currency === "USD" ? 50 : 50 * conversionRate
  if (amountUSD <= 2000) return currency === "USD" ? 100 : 100 * conversionRate
  return amount * 0.05
}

export default function Home() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [calculatorCurrency, setCalculatorCurrency] = useState<"USD" | "KES">("USD")
  const [calculatorAmount, setCalculatorAmount] = useState<string>("")
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null)

  useEffect(() => {
    if (calculatorAmount) {
      const amount = Number.parseFloat(calculatorAmount)
      if (!isNaN(amount)) {
        setCalculatedFee(calculateFee(amount, calculatorCurrency))
      } else {
        setCalculatedFee(null)
      }
    } else {
      setCalculatedFee(null)
    }
  }, [calculatorAmount, calculatorCurrency])

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard/group-chat')
    } else {
      router.push('/auth')
    }
  }

  return (
    <div className="flex flex-col gap-12 pb-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary via-green-500 to-secondary text-white dark:from-primary-dark dark:via-green-700 dark:to-secondary-dark py-20">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-5">
            Secure Escrow for Online Transactions
          </h1>
          <p className="text-md mb-8">
            Xcrow brings buyers and sellers together in a safe, monitored environment for confident deals.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Create Xcrow Group-chat Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">
          How Xcrow Works
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-[1rem]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                1. Connect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Buyer and seller join a Xcrow group to discuss and agree on terms.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-6 w-6 text-primary" />
                2. Deposit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Buyer makes a deposit to Xcrow, which is held securely in escrow.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-6 w-6 text-primary" />
                3. Deliver & Communicate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seller delivers the service. Both parties communicate in the monitored Xcrow group chat.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Check className="mr-2 h-6 w-6 text-primary" />
                4. Confirm & Release
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Both parties confirm satisfaction. Xcrow releases the payment to the seller.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fees & Payment Methods Section */}
      <section id='pricing' className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Transparent <span className="text-purple-600 dark:text-purple-400">Fees</span>
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              We believe in keeping our fees low and transparent to make transactions accessible for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Fee Structure Card */}
            <div className="bg-gradient-to-br from-purple-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg overflow-hidden">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Our Fee Structure</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="py-2 px-4 font-semibold text-gray-900 dark:text-white">Amount Range (in USD)</th>
                      <th className="py-2 px-4 font-semibold text-gray-900 dark:text-white">Fee (USD)</th>
                      <th className="py-2 px-4 font-semibold text-gray-900 dark:text-white">Fee (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { range: "0 - 5", feeUSD: "0", feeKES: "0" },
                      { range: "5.01 - 10", feeUSD: "1", feeKES: "130" },
                      { range: "10.01 - 50", feeUSD: "3", feeKES: "390" },
                      { range: "50.01 - 80", feeUSD: "5", feeKES: "650" },
                      { range: "80.01 - 200", feeUSD: "10", feeKES: "1,300" },
                      { range: "200.01 - 500", feeUSD: "20", feeKES: "2,600" },
                      { range: "500.01 - 1,000", feeUSD: "50", feeKES: "6,500" },
                      { range: "1,000.01 - 2,000", feeUSD: "100", feeKES: "13,000" },
                      { range: "2,000.01+", feeUSD: "5%", feeKES: "5%" },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{row.range}</td>
                        <td className="py-2 px-4 text-purple-600 dark:text-purple-400 font-semibold">{row.feeUSD}</td>
                        <td className="py-2 px-4 text-purple-600 dark:text-purple-400 font-semibold">{row.feeKES}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Note: For amounts over $2,000 or KES 260,000, a 5% fee applies.
              </p>
            </div>

            {/* Payment Methods & Fee Calculator Card */}
            <div className="bg-gradient-to-br from-purple-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Payment Methods</h3>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Crypto Payments */}
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.328-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.974.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"
                        fill="#F7931A"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Crypto</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bitcoin & other major cryptocurrencies
                  </p>
                </div>

                {/* M-PESA Payments */}
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-32 h-16 mx-auto mb-4 relative">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mpesa-logo-UOM7KIBywOrvuJudP1Znke4JlRthXT.png"
                      alt="M-PESA"
                      className="w-full h-full object-contain"
                      width={100}
                      height={100}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">M-PESA</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mobile money transfers</p>
                </div>
              </div>

              {/* Fee Calculator */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h4 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Fee Calculator
                </h4>
                <div className="space-y-4">
                  <RadioGroup
                    defaultValue="USD"
                    onValueChange={(value) =>
                      setCalculatorCurrency(value as "USD" | "KES")
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="usd" />
                      <Label htmlFor="usd">USD</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="KES" id="kes" />
                      <Label htmlFor="kes">KES</Label>
                    </div>
                  </RadioGroup>
                  <div className="flex space-x-4">
                    <div className="flex-grow">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        type="number"
                        id="amount"
                        placeholder="Enter amount"
                        value={calculatorAmount}
                        onChange={(e) => setCalculatorAmount(e.target.value)}
                      />
                    </div>
                    <div className="flex-grow">
                      <Label htmlFor="fee">Estimated Fee</Label>
                      <Input
                        type="text"
                        id="fee"
                        readOnly
                        value={
                          calculatedFee !== null
                            ? formatCurrency(calculatedFee, calculatorCurrency)
                            : ""
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted dark:bg-gray-800 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">
            Why Choose Xcrow
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-[1rem]">
            <Card>
              <CardHeader>
                <CardTitle>Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our escrow service ensures that funds are only released when both parties are satisfied, protecting both buyers and sellers throughout the process.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monitored Group Chats</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Communicate safely within our monitored Xcrow group chats, ensuring transparency and reducing the risk of disputes.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  In case of disagreements, our team provides fair and efficient dispute resolution based on the monitored chat history and transaction details.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flexible Service Escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Perfect for service-based transactions, our platform allows for clear communication, milestone tracking, and secure payment release upon mutual confirmation.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto text-center px-4 pb-8 mb-5">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Transact with Confidence?
        </h2>
        <p className="text-ms mb-8">
          Join Xcrow today and experience secure, monitored service transactions.
        </p>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
        >
          {user ? 'Create Xcrow Group' : 'Sign Up Now'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  )
}
