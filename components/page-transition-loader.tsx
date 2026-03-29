"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AppLoadingScreen } from "@/components/app-loading-screen"
import { cn } from "@/lib/utils"

type PageTransitionLoaderDetail = {
  durationMs?: number
}

const DEFAULT_LOADING_DURATION_MS = 3000
const PAGE_TRANSITION_START_EVENT = "xcrow:page-transition-start"

export function triggerPageTransitionLoader(durationMs = DEFAULT_LOADING_DURATION_MS) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<PageTransitionLoaderDetail>(PAGE_TRANSITION_START_EVENT, {
      detail: { durationMs },
    }),
  )
}

export function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(true)
  const [loadingCycle, setLoadingCycle] = useState(0)
  const [loadingDurationMs, setLoadingDurationMs] = useState(DEFAULT_LOADING_DURATION_MS)

  useEffect(() => {
    const handleStartLoading = (event: Event) => {
      const customEvent = event as CustomEvent<PageTransitionLoaderDetail>
      const requestedDurationMs = Number(customEvent.detail?.durationMs)

      setLoadingDurationMs(
        Number.isFinite(requestedDurationMs) && requestedDurationMs > 0
          ? requestedDurationMs
          : DEFAULT_LOADING_DURATION_MS,
      )
      setShowLoader(true)
      setLoadingCycle((currentCycle) => currentCycle + 1)
    }

    window.addEventListener(PAGE_TRANSITION_START_EVENT, handleStartLoading)

    return () => {
      window.removeEventListener(PAGE_TRANSITION_START_EVENT, handleStartLoading)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowLoader(false)
    }, loadingDurationMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadingCycle, loadingDurationMs])

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden">
      <div
        aria-busy={showLoader}
        className={cn(
          "transition-[filter,transform,opacity] duration-500 ease-out",
          showLoader && "pointer-events-none select-none blur-[18px] scale-[1.01] opacity-35 brightness-75 saturate-50",
        )}
      >
        {children}
      </div>

      <div
        aria-hidden={!showLoader}
        className={cn(
          "pointer-events-none fixed inset-0 z-[110] flex items-center justify-center px-4 transition-opacity duration-300 sm:px-6",
          showLoader ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="relative z-10 w-full max-w-md">
          <AppLoadingScreen
            fullScreen={false}
            showSurfaceBackdrop={false}
            className="min-h-0"
            title="Loading your secure page"
            subtitle="Please wait a few seconds while we finish preparing everything for you."
          />
        </div>
      </div>
    </div>
  )
}
