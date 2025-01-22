"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"

const publicPaths = ["/", "/auth", "/terms", "/privacy", "/refund-policy"]

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    if (!user && !publicPaths.includes(pathname)) {
      router.push("/auth")
    }
  }, [user, router, pathname])

  return <>{children}</>
}

