/* eslint-disable */

"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, Menu, Sun, Moon, Users, Shield, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"

// Add this function at the top of your file, outside of the component
function formatCurrency(amount: number, currency: "USD" | "KES"): string {
  return currency === "USD"
    ? `$${amount.toFixed(2)}`
    : `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Add this function to calculate the fee
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
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [calculatorCurrency, setCalculatorCurrency] = useState<"USD" | "KES">("USD")
  const [calculatorAmount, setCalculatorAmount] = useState<string>("")
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null)

  useEffect(() => setMounted(true), [])

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

  if (!mounted) return null

  // Add this inside your component, before the return statement
  const feeStructure = [
    { range: "0 - 5", feeUSD: "0", feeKES: "0" },
    { range: "5.01 - 10", feeUSD: "1", feeKES: "130" },
    { range: "10.01 - 50", feeUSD: "3", feeKES: "390" },
    { range: "50.01 - 80", feeUSD: "5", feeKES: "650" },
    { range: "80.01 - 200", feeUSD: "10", feeKES: "1,300" },
    { range: "200.01 - 500", feeUSD: "20", feeKES: "2,600" },
    { range: "500.01 - 1,000", feeUSD: "50", feeKES: "6,500" },
    { range: "1,000.01 - 2,000", feeUSD: "100", feeKES: "13,000" },
    { range: "2,000.01+", feeUSD: "5%", feeKES: "5%" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              {mounted && (
                <Image
                  src={theme === "dark" ? "/logo11X.png" : "/logo11xx.png"}
                  alt="Xcrow Logo"
                  width={100}
                  height={100}
                  priority
                />
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/auth">Get Started</Link>
              </Button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-700 dark:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-3 space-y-3">
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Secure Escrow for
                <span className="text-purple-600 dark:text-purple-400"> Online Transactions</span>
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-lg">
                Xcrow brings buyers and sellers together in a safe, monitored environment for confident deals.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/create-group">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Create Xcrow Group
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-green-400 rounded-2xl transform rotate-3 scale-105 opacity-20 dark:opacity-10"></div>
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">How Xcrow Works</h3>
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Connect with buyers or sellers from online marketplaces (Facebook, Twitter, WhatsApp, & Telegram
                      etc.)
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-700 dark:text-gray-300">Bring them to Xcrow to secure funds</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-700 dark:text-gray-300">Communicate safely in monitored chats</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <ArrowRight className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-700 dark:text-gray-300">Complete transaction with confidence</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose <span className="text-purple-600 dark:text-purple-400">Xcrow</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Secure Transactions",
                icon: Shield,
                description: "Your funds are protected throughout the entire process.",
              },
              {
                title: "Monitored Communication",
                icon: MessageCircle,
                description: "Chat safely within our monitored escrow groups.",
              },
              {
                title: "User-Friendly Platform",
                icon: Users,
                description: "Easy-to-use interface for smooth transactions.",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <feature.icon className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees & Payment Methods Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bitcoin & other major cryptocurrencies</p>
                </div>

                {/* M-PESA Payments */}
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="w-32 h-16 mx-auto mb-4 relative">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mpesa-logo-UOM7KIBywOrvuJudP1Znke4JlRthXT.png"
                      alt="M-PESA"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">M-PESA</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mobile money transfers</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Available for Kenyan users only.</p>
                </div>
              </div>

              {/* Fee Calculator */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h4 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Fee Calculator</h4>
                <div className="space-y-4">
                  <RadioGroup
                    defaultValue="USD"
                    onValueChange={(value) => setCalculatorCurrency(value as "USD" | "KES")}
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
                        value={calculatedFee !== null ? formatCurrency(calculatedFee, calculatorCurrency) : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to Transact with Confidence?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join Xcrow today and experience secure, monitored service transactions.
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  )
}

