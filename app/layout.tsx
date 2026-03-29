import type React from "react"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { PageTransitionLoader } from "@/components/page-transition-loader"
import { COOKIE_CONSENT_NAME } from "@/lib/serverAuth"
import "./globals.css"
import type { Metadata } from "next"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Xcrow - Secure Escrow for Online Transactions",
  description: "Xcrow brings buyers and sellers together in a safe, monitored environment for confident deals.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieConsent = cookieStore.get(COOKIE_CONSENT_NAME)?.value ?? null

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="escrow-theme">
          <PageTransitionLoader>{children}</PageTransitionLoader>
          <CookieConsentBanner initialConsent={cookieConsent} />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}

