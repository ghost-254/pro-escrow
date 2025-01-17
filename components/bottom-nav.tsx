'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  User,
  Users,
  CreditCard,
  History,
} from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-5">
        <Link
          href="/orders"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          href="/groups"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/groups' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Groups</span>
        </Link>
        <Link
          href="/transactions"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/transactions'
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">Transactions</span>
        </Link>
        <Link
          href="/history"
          className={cn(
            'inline-flex flex-col items-center justify-center px-5',
            pathname === '/history' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <History className="h-5 w-5" />
          <span className="text-xs">History</span>
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
