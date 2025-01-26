'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import type { RootState } from '@/lib/stores/store'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import { MobileSidebar } from '@/components/mobile-sidebar'

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()

  // This helps avoid a "theme flash" or SSR mismatch:
  const { theme, setTheme } = useTheme()

  const handleChangetheme = () => {
    setTheme('light') //when navigating to login make it light
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInteraction = () => {
    if (!user) {
      router.push('/auth')
    }
  }

  // If you want to prevent a flash of the wrong logo on initial load:
  if (!mounted) {
    return null
  }

  // Decide which logo to show
  const logoSrc =
    theme === 'dark'
      ? '/logo11X.png' // Dark mode logo
      : '/logo11xx.png' // Light mode logo

  return (
    <header className="sticky left-0 bg-background z-[12] top-0 right-0 w-full border-t  h-14 ">
      <div className="w-full h-full lg:p-[1rem] p-[0.5rem] flex justify-between items-center">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logoSrc}
            alt="Xcrow Logo"
            width={90}
            height={90}
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
            className="text-primary  hover:text-primary-foreground hover:text-white hover:bg-primary hidden lg:inline-flex"
            onClick={handleInteraction}
          >
            Sell
          </Button>
          <Button
            variant="ghost"
            className="hover:text-secondary-foreground text-secondary hover:text-white hover:bg-secondary hidden lg:inline-flex"
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
              <Button
                onClick={handleChangetheme}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
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
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </header>
  )
}
