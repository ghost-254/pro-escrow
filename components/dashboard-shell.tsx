"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastContainer } from "react-toastify"
import { Providers } from "@/app/global.redux/provider"
import { persistor } from "@/lib/stores/store"
import { PersistGate } from "redux-persist/integration/react"
import { TransactionProvider } from "@/context/transactionContext"
import { UserProvider } from "@/context/userContext"
import AuthProvider from "@/components/AuthProvider"
import "react-toastify/dist/ReactToastify.css"

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <PersistGate loading={null} persistor={persistor}>
        <TransactionProvider>
          <UserProvider>
            <AuthProvider>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="escrow-theme">
                <div className="flex h-screen overflow-hidden">
                  <aside className="hidden lg:flex lg:flex-col w-64 h-screen overflow-y-auto border-r bg-muted">
                    <Sidebar />
                  </aside>

                  <main className="flex-1 flex flex-col h-screen overflow-hidden">
                    <Navigation />
                    <div className="flex-1 overflow-y-auto">{children}</div>
                  </main>
                </div>
              </ThemeProvider>
            </AuthProvider>
          </UserProvider>
        </TransactionProvider>
      </PersistGate>
      <ToastContainer position="bottom-right" theme="colored" />
    </Providers>
  )
}
