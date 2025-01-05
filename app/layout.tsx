import React from 'react'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { SidebarVisibility } from '@/components/sidebars/sidebarvisibility'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './global.redux/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Escrow Platform',
  description: 'Secure transactions between buyers and sellers',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased `}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="escrow-theme"
          >
            <div className="relative flex h-screen  overflow-hidden flex-col">
              <Navigation session={session} />
              <div className="h-full w-full flex">
                <SidebarVisibility>
                  <div className="h-full w-full overflow-hidden  md:flex-[0.75] text-[0.95rem]">
                    <main>{children}</main>
                  </div>
                </SidebarVisibility>
              </div>
              <BottomNav />
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
