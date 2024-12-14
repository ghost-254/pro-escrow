import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { MenuIcon } from 'lucide-react'
import { User } from 'lucide-react'

interface NavigationProps {
  session: Session | null
}

export function Navigation({ session }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">Escrow Platform</span>
        </Link>
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-primary">Sell</Button>
          <Button variant="ghost" className="text-secondary hover:text-secondary-foreground hover:bg-secondary">Buy</Button>
          <ThemeToggle />
          {session ? (
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          ) : (
            <Link href="/auth">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

