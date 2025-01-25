// app/layout.tsx

import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { Sidebar } from '@/components/sidebar'
import { Footer } from '@/components/footer'
import { ToastContainer } from 'react-toastify'
import { Providers } from './global.redux/provider'
import { RouteGuard } from '@/components/route-guard'
import 'react-toastify/dist/ReactToastify.css'
import './globals.css'
import Head from 'next/head'
import { metadata } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>

    <Head>
        <title>{metadata.title as string}</title>
        <meta name="description" content={metadata.description as string} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>

      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="escrow-theme"
          >
            <RouteGuard>
              {/* Main Header */}
              <Navigation />

              {/* Page Content */}
              <div className="flex">
                {/* Desktop Sidebar (hidden on small and medium screens) */}
                <div className="hidden lg:block border-r bg-muted h-[calc(120vh-56px)] w-64">
                  <Sidebar />
                </div>

                {/* Main Content and Footer */}
                <div className="flex-1 flex flex-col min-h-screen">
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />

                  {/* Bottom Navigation (Mobile) */}
                  <div className="lg:hidden">
                    <BottomNav />
                  </div>
                </div>
              </div>
            </RouteGuard>
          </ThemeProvider>
          <ToastContainer position="bottom-right" theme="colored" />
        </Providers>
      </body>
    </html>
  )
}
