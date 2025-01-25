'use client'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { BottomNav } from '@/components/bottom-nav'
import { Sidebar } from '@/components/sidebar'
import { Footer } from '@/components/footer'
import { ToastContainer } from 'react-toastify'
import { Providers } from './global.redux/provider'
import 'react-toastify/dist/ReactToastify.css'
import './globals.css'
import { metadata } from '@/lib/metadata' // Import metadata
import Head from 'next/head' // Import Head component from next/head
import { usePathname } from 'next/navigation'
// import { RouteGuard } from '@/components/route-guard'
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')
  const isGroupsPage = pathname.startsWith('/groups')

  // Combine conditions to determine if we should hide footer and bottom navigation
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
        className={`${inter.className} w-full max-h-screen bg-background antialiased`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="escrow-theme"
          >
            <div className="flex flex-col gap-[0.5rem] max-h-screen">
              {!isAuthPage && <Navigation />}
              <div className="flex w-full z-10">
                {/* {!isAuthPage && ( */}
                  <aside className="hidden lg:block w-[25%] border-r bg-muted">
                    <Sidebar />
                  </aside>
                {/* )} */}
                <div
                  className={
                    isAuthPage ? 'w-full' : 'flex w-full lg:w-[75%] flex-col'
                  }
                >
                  <main>{children}</main>
                  {!shouldHideFooterAndNav && <Footer />}
                </div>
              </div>
              {!shouldHideFooterAndNav && (
                <div className="md:hidden">
                  <BottomNav />
                </div>
              )}
            </div>
          </ThemeProvider>
          <ToastContainer position="bottom-right" theme="colored" />
        </Providers>
      </body>
    </html>
  )
}
