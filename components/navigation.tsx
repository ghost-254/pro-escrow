"use client"

import Link from "next/link"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import type { RootState } from "@/lib/stores/store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { MobileSidebar } from "@/components/mobile-sidebar"

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // If you want to prevent a flash of the wrong logo on initial load:
  if (!mounted) {
    return null
  }

  const scrollToPricing = () => {
    router.push("/dashboard#pricing")
    // Add smooth scrolling to the pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById("pricing")
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  return (
    <header className="sticky top-0 right-0 bg-background z-[12] w-full border-b h-14">
      <div className="w-full h-full lg:p-[1rem] p-[0.5rem] flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center space-x-2">
          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Desktop-only Buttons */}
          <Button
            variant="ghost"
            className="text-primary hover:text-primary-foreground hover:text-white hover:bg-primary hidden lg:inline-flex"
            onClick={() => router.push("/")}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            className="hover:text-secondary-foreground text-secondary hover:text-white hover:bg-secondary hidden lg:inline-flex"
            onClick={scrollToPricing}
          >
            Pricing
          </Button>
        </div>

        {/* Right aligned items */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu / Sign In (Desktop) */}
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/auth">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  )
}
