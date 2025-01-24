"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { setUser } from "@/lib/slices/authSlice"
import { auth } from "@/lib/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, DollarSign, Users, MessageCircle, Check } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      dispatch(setUser(currentUser))
    })

    return () => unsubscribe()
  }, [dispatch])

  const handleGetStarted = () => {
    if (user) {
      router.push("/xcrow-groups")
    } else {
      router.push("/auth")
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-12 pb-16">
        {/* Hero Section with updated gradient */}
        <section className="bg-gradient-to-r from-primary via-green-500 to-secondary text-white dark:from-primary-dark dark:via-green-700 dark:to-secondary-dark py-20">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Secure Escrow for Online Transactions</h1>
            <p className="text-xl mb-8">
              Xcrow brings buyers and sellers together in a safe, monitored environment for confident deals.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* How It Works Section - Updated to reflect the new process */}
        <section className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Xcrow Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-6 w-6 text-primary" />
                  1. Connect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Buyer and seller join a Xcrow group to discuss and agree on terms.</CardDescription>
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
                <CardDescription>Buyer makes a deposit to Xcrow, which is held securely in escrow.</CardDescription>
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

        {/* Benefits Section */}
        <section className="bg-muted dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Xcrow</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Secure Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our escrow service ensures that funds are only released when both parties are satisfied, protecting
                    both buyers and sellers throughout the process.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Monitored Group Chats</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Communicate safely within our monitored Xcrow group chats, ensuring transparency and reducing the
                    risk of disputes.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    In case of disagreements, our team provides fair and efficient dispute resolution based on the
                    monitored chat history and transaction details.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Flexible Service Escrow</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Perfect for service-based transactions, our platform allows for clear communication, milestone
                    tracking, and secure payment release upon mutual confirmation.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto text-center px-4 pb-8">
          <h2 className="text-3xl font-bold mb-6">Ready to Transact with Confidence?</h2>
          <p className="text-xl mb-8">Join Xcrow today and experience secure, monitored service transactions.</p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-primary text-white hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90"
          >
            {user ? "Create Xcrow Group" : "Sign Up Now"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </section>
      </div>
    </ScrollArea>
  )
}

