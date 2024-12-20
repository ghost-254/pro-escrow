import React from 'react'
import { ListingCard } from '@/components/listing-card'
import { ListingFilters } from '@/components/listing-filters'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Home() {
  // Resolve the cookies promise
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value || null
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="bg-primary/5 p-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight">
            Secure Escrow Services
          </h1>
          <p className="text-muted-foreground">
            Find trusted sellers and secure your transactions
          </p>
        </div>
      </div>
      <div className="container">
        <ListingFilters />
        <div className="mt-4 grid gap-4">
          <ListingCard
            seller={{
              name: 'TrustedSeller',
              rating: '98%',
              orders: 2645,
              avatar: '/placeholder.svg',
            }}
            service={{
              title: 'Social Media Account Transfer',
              price: '1,000.00',
              currency: 'USD',
              description: 'Verified Instagram account with 100k+ followers',
            }}
            paymentMethods={['Bank Transfer', 'PayPal']}
          />
          <ListingCard
            seller={{
              name: 'VerifiedEscrow',
              rating: '99%',
              orders: 1221,
              avatar: '/placeholder.svg',
            }}
            service={{
              title: 'Website Domain Transfer',
              price: '5,000.00',
              currency: 'USD',
              description: 'Premium .com domain, 10+ years old',
            }}
            paymentMethods={['Bank Transfer', 'Crypto']}
          />
        </div>
      </div>
    </div>
  )
}
