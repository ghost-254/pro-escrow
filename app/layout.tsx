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
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Navigation session={session} />
              <div style={{ height: '100%', width: '100%' }}>
                <SidebarVisibility>
                  <div
                    style={{
                      height: '100%',
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
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
