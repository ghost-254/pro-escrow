
"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-muted p-4 hidden md:block">
      <nav className="space-y-2">
        <Link href="/">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              pathname === '/' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary-foreground hover:bg-primary'
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        <Link href="/search">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              pathname === '/search' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary-foreground hover:bg-primary'
            )}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </Link>
        <Link href="/new">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              pathname === '/new' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary-foreground hover:bg-primary'
            )}
          >
            <PlusSquare className="mr-2 h-4 w-4" />
            Post
          </Button>
        </Link>
        <Link href="/notifications">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              pathname === '/notifications' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary-foreground hover:bg-primary'
            )}
          >
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </Button>
        </Link>
        <Link href="/profile">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              pathname === '/profile' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary-foreground hover:bg-primary'
            )}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </Link>
      </nav>
    </div>
  )
}

