'use client'
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
import { usePathname } from 'next/navigation'
import { WalletProvider } from '../context/walletContext'
import { TransactionProvider } from '../context/transactionContext'
import { UserProvider } from '../context/userContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')
  const isGroupsPage = pathname.startsWith('/groups')

  // Combine conditions to determine if footer and bottom navigation should be hidden
  const shouldHideFooterAndNav = isAuthPage || isGroupsPage

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

      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
      >
        <Providers>
          <TransactionProvider>
            <UserProvider>
              <WalletProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem={false}
                  storageKey="escrow-theme"
                >
                  <RouteGuard>
                    {/* Header Navigation */}
                    {!isAuthPage && <Navigation />}

                    {/* Page Content */}
                    <div className="flex">
                      {/* Desktop Sidebar */}
                      {/* {!isAuthPage && ( */}
                      <div className="hidden  lg:block border-r bg-muted h-[calc(100vh-56px)] w-64">
                        <Sidebar />
                      </div>
                      {/* )} */}

                      {/* Main Content Area */}
                      <div
                        className={`flex-1 flex flex-col ${
                          isAuthPage ? 'w-full' : 'lg:w-auto'
                        }`}
                      >
                        <main className="flex-1">{children}</main>

                        {/* Footer */}
                        {!shouldHideFooterAndNav && <Footer />}

                        {/* Bottom Navigation (Mobile Only) */}
                        {!shouldHideFooterAndNav && (
                          <div className="lg:hidden">
                            <BottomNav />
                          </div>
                        )}
                      </div>
                    </div>
                  </RouteGuard>
                </ThemeProvider>
              </WalletProvider>
            </UserProvider>
          </TransactionProvider>

          <ToastContainer position="bottom-right" theme="colored" />
        </Providers>
      </body>
    </html>
  )
}
