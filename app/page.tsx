//app/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { setUser } from '@/lib/slices/authSlice'
import { auth } from '@/lib/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import { ListingCard } from '@/components/listing-card'
import { ListingFilters } from '@/components/listing-filters'
import { Button } from '@/components/ui/button'

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

  const handleInteraction = () => {
    if (!user) {
      router.push('/auth')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="bg-primary/10 p-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Secure Xcrow Services</h1>
          <p className="text-muted-foreground">Find trusted sellers and secure your transactions</p>
        </div>
      </div>
      <div className="container">
        <ListingFilters />
        <div className="mt-4 grid gap-4">
          <ListingCard
            seller={{
              name: "TrustedSeller",
              rating: "98%",
              orders: 2645,
              avatar: "/placeholder.svg"
            }}
            service={{
              title: "Social Media Account Transfer",
              price: "1,000.00",
              currency: "USD",
              description: "Verified Instagram account with 100k+ followers"
            }}
            paymentMethods={["Bank Transfer", "PayPal"]}
            onInteraction={handleInteraction}
          />
          <ListingCard
            seller={{
              name: "VerifiedEscrow",
              rating: "99%",
              orders: 1221,
              avatar: "/placeholder.svg"
            }}
            service={{
              title: "Website Domain Transfer",
              price: "5,000.00",
              currency: "USD",
              description: "Premium .com domain, 10+ years old"
            }}
            paymentMethods={["Bank Transfer", "Crypto"]}
            onInteraction={handleInteraction}
          />
        </div>
        {!user && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-lg">Sign in to interact with listings and access all features.</p>
            <Button onClick={() => router.push('/auth')}>Sign In / Sign Up</Button>
          </div>
        )}
      </div>
    </div>
  )
}
