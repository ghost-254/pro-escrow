// File: app/layout.tsx

import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { ToastContainer } from "react-toastify"
import { Providers } from "./global.redux/provider"
import { RouteGuard } from "@/components/route-guard"
import "react-toastify/dist/ReactToastify.css"
import "./globals.css"
import { metadata } from "@/lib/metadata" // Import metadata
import Head from "next/head" // Import Head component from next/head

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>{metadata.title as string}</title> {/* Type assertion */}
        <meta name="description" content={metadata.description as string} /> {/* Type assertion */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <body className={`${inter.className} max-h-screen bg-background antialiased`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="escrow-theme">
            <RouteGuard>
              <div className="flex flex-col min-h-screen">
                <Navigation />
                <div className="flex flex-grow z-999">
                  <aside className="hidden lg:block w-64 border-r bg-muted">
                    <Sidebar />
                  </aside>
                  <div className="flex-1 flex flex-col">
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </div>
                <div className="md:hidden">
                  <BottomNav />
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

