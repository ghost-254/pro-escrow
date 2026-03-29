//components/route-guard.tsx

"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSelector } from "react-redux"
import { AppLoadingScreen } from "@/components/app-loading-screen"
import type { RootState } from "@/lib/stores/store"

const publicPaths = ["/", "/auth", "/terms", "/privacy", "/refund-policy"]

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSelector((state: RootState) => state.auth.user)
  const loading = useSelector((state: RootState) => state.auth.loading)

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      // Redirect to the auth page if the user is not logged in and the path is not public
      router.push("/auth")
    }
  }, [user, router, pathname, loading])

  // Show a loading spinner or placeholder while checking authentication state
  if (loading) {
    return (
      <AppLoadingScreen
        title="Checking your session"
        subtitle="Please wait a moment while we confirm your access."
      />
    )
  }

  // Allow access to public paths or if the user is authenticated
  if (publicPaths.includes(pathname) || user) {
    return <>{children}</>
  }

  // If the user is not authenticated and the path is not public, return null (or a redirect message)
  return null
}
