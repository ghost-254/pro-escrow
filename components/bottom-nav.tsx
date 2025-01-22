'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, CreditCard, Bell, User } from 'lucide-react'
import { success } from '@/components/ui/color'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav id='bottom-nav' className="fixed bottom-0 left-0 z-50 w-full border-t bg-background">
      <div className="grid h-16 grid-cols-5">
        <Link
          href="/"
          className={cn(
            'inline-flex flex-col items-center justify-center',
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>
        
        <Link
          href="/groups"
          className={cn(
            'inline-flex flex-col items-center justify-center relative',
            pathname === '/groups' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Chats</span>
          <span
            style={{ background: success[600] }}
            className="absolute top-1 right-6 px-1 rounded text-[0.6rem] text-white font-bold"
          >
            New
          </span>
        </Link>

        <Link
          href="/transactions"
          className={cn(
            'inline-flex flex-col items-center justify-center',
            pathname === '/transactions' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs">Transactions</span>
        </Link>

        <Link
          href="/orders"
          className={cn(
            'inline-flex flex-col items-center justify-center',
            pathname === '/orders' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Bell className="h-5 w-5" />
          <span className="text-xs">Orders</span>
        </Link>

        <Link
          href="/profile"
          className={cn(
            'inline-flex flex-col items-center justify-center',
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

