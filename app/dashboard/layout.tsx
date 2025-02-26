"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Sidebar } from "@/components/sidebar"
import { RouteGuard } from "@/components/route-guard"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastContainer } from "react-toastify"
import { Providers } from "../global.redux/provider"
import { Provider } from "react-redux"
import { persistor, store } from "@/lib/stores/store"
import { PersistGate } from "redux-persist/integration/react"
import { TransactionProvider } from "../../context/transactionContext"
import { UserProvider } from "../../context/userContext"
import AuthProvider from "@/components/AuthProvider"
import "react-toastify/dist/ReactToastify.css"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <TransactionProvider>
            <UserProvider>
                <AuthProvider>
                  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="escrow-theme">
                    <RouteGuard>
                      <Navigation />
                      <div className="flex h-screen">
                        <div className="hidden lg:flex lg:flex-col border-r bg-muted w-64 h-full overflow-y-auto">
                          <Sidebar />
                        </div>
                        <div className="flex-1 h-full overflow-y-auto">{children}</div>
                      </div>
                    </RouteGuard>
                  </ThemeProvider>
                </AuthProvider>
            </UserProvider>
          </TransactionProvider>
        </PersistGate>
      </Provider>
      <ToastContainer position="bottom-right" theme="colored" />
    </Providers>
  )
}

