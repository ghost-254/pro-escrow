'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
// import { toast } from '@/hooks/use-toast'

export function UserMenu() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  // const supabase = createBrowserClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // )

  const handleSignOut = async () => {
    setIsLoading(true)
    // const { error } = await supabase.auth.signOut()
    setIsLoading(false)
    // if (error) {
    //   toast({
    //     title: 'Error',
    //     description: 'There was a problem signing out.',
    //     variant: 'destructive',
    //   })
    // } else {
    //   router.push('/auth')
    //   router.refresh()
    // }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isLoading}>
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
