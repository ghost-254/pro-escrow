import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { BottomNav } from '@/components/bottom-nav'
import type { Metadata } from 'next'
import './globals.css'

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="escrow-theme"
        >
          <div className="relative flex min-h-screen flex-col">
            <Navigation session={session} />
            <main className="flex-1">{children}</main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

