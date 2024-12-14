'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-5">
        <Link
          href="/"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          href="/search"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/search' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Search</span>
        </Link>
        <Link
          href="/new"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/new' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <PlusSquare className="h-5 w-5" />
          <span className="text-xs">Post</span>
        </Link>
        <Link
          href="/notifications"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Bell className="h-5 w-5" />
          <span className="text-xs">Alerts</span>
        </Link>
        <Link
          href="/profile"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </nav>
  )
}

