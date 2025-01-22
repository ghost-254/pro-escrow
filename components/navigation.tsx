"use client"

import Link from "next/link"
import Image from "next/image"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"

// If you're using shadcn/ui:
import { useTheme } from "next-themes"
// or if you have a custom setup, import the correct useTheme hook

import type { RootState } from "@/lib/stores/store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { MobileSidebar } from "@/components/mobile-sidebar"

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()

  // This helps avoid a "theme flash" or SSR mismatch:
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInteraction = () => {
    if (!user) {
      router.push("/auth")
    }
  }

  // If you want to prevent a flash of the wrong logo on initial load:
  if (!mounted) {
    return null
  }

  // Decide which logo to show
  const logoSrc = theme === "dark"
    ? "/logo11X.png"    // Dark mode logo
    : "/logo11xx.png"   // Light mode logo

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14">
      <div className="container flex h-full items-center">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logoSrc}
            alt="Platform Logo"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
          {/* If you only want the image, remove this span.
              If you need an accessible text label, keep it as sr-only. */}
          <span className="sr-only">Xcrow</span>
        </Link>

        {/* Right Section */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Desktop-only Buttons */}
          <Button
            variant="ghost"
            className="text-primary hover:text-primary-foreground hover:bg-primary hidden lg:inline-flex"
            onClick={handleInteraction}
          >
            Sell
          </Button>
          <Button
            variant="ghost"
            className="text-secondary hover:text-secondary-foreground hover:bg-secondary hidden lg:inline-flex"
            onClick={handleInteraction}
          >
            Buy
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu / Sign In (Desktop) */}
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/auth">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                Sign In
              </Button>
            </Link>
          )}

          {/* Hamburger Menu (Mobile/Tablet) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  )
}
