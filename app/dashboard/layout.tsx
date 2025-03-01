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
                    <div className="flex h-screen overflow-hidden">
                      {/* Sidebar - independently scrollable, hidden on small and medium screens */}
                      <aside className="hidden lg:flex lg:flex-col w-64 h-screen overflow-y-auto border-r bg-muted">
                        <Sidebar />
                      </aside>

                      {/* Main content area */}
                      <main className="flex-1 flex flex-col h-screen overflow-hidden">
                        {/* Navigation header - doesn't extend to sidebar */}
                        <Navigation />

                        {/* Content area - independently scrollable */}
                        <div className="flex-1 overflow-y-auto">{children}</div>
                      </main>
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
