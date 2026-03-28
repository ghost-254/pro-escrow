"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface CookieConsentBannerProps {
  initialConsent?: string | null
}

export function CookieConsentBanner({ initialConsent }: CookieConsentBannerProps) {
  const [consent, setConsent] = useState(initialConsent ?? null)
  const [isSaving, setIsSaving] = useState(false)

  if (consent) {
    return null
  }

  const saveConsent = async (value: "essential" | "all") => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/cookies/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consent: value }),
      })

      const result: { success?: boolean; error?: string } = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save cookie preferences.")
      }

      setConsent(value)
    } catch {
      setIsSaving(false)
      return
    }

    setIsSaving(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Cookie Notice
          </p>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Xcrow uses essential cookies for secure sign-in, fraud reduction, session integrity,
            and core site functionality. You can allow optional cookies for a smoother experience.
            Learn more in our{" "}
            <Link href="/privacy" className="font-medium underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => saveConsent("essential")}
            disabled={isSaving}
          >
            Essential Only
          </Button>
          <Button onClick={() => saveConsent("all")} disabled={isSaving}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
