"use client"

import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Sidebar } from "@/components/sidebar"
// import { Footer } from "@/components/footer"
import { ToastContainer } from "react-toastify"
import { Providers } from "./global.redux/provider"
import { RouteGuard } from "@/components/route-guard"
import "react-toastify/dist/ReactToastify.css"
import "./globals.css"
import Head from "next/head"
import { metadata } from "@/lib/metadata"
import { usePathname } from "next/navigation"
import { WalletProvider } from "../context/walletContext"
import { TransactionProvider } from "../context/transactionContext"
import { UserProvider } from "../context/userContext"
import AuthProvider from "@/components/AuthProvider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // We no longer hide or show elements based on route.
  // If you want to do so, you can read the pathname:
  usePathname()

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

      <body className={`${inter.className} bg-background antialiased`}>
        <Providers>
          <TransactionProvider>
            <UserProvider>
              <WalletProvider>
                <AuthProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    storageKey="escrow-theme"
                  >
                    <RouteGuard>
                      {/* Header Nav always visible */}
                      <Navigation />

                      {/* Two-column layout without a footer */}
                      <div className="flex h-screen">
                        {/* Sidebar: hidden on mobile, scrollable */}
                        <div className="hidden lg:flex lg:flex-col border-r bg-muted w-64 h-full overflow-y-auto">
                          <Sidebar />
                        </div>

                        {/* Main content (scrollable) */}
                        <div className="flex-1 h-full overflow-y-auto">
                          {children}
                        </div>
                      </div>

                      {/* Bottom Navigation for mobile only */}
                      <div className="lg:hidden">
                        <BottomNav />
                      </div>
                    </RouteGuard>
                  </ThemeProvider>
                </AuthProvider>
              </WalletProvider>
            </UserProvider>
          </TransactionProvider>

          <ToastContainer position="bottom-right" theme="colored" />
        </Providers>
      </body>
    </html>
  )
}
