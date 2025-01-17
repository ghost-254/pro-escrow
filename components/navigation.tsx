'use client'
import React from 'react'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Plus, User } from 'lucide-react'
import { toggleTransactModal } from '@/app/global.redux/stores/reducers/transact.reducer'
import { useDispatch } from 'react-redux'

interface NavigationProps {
  session: Session | null
}

export function Navigation({ session }: NavigationProps) {
  const dispatch = useDispatch()
  const handleOpenTransactModal = () => {
    // Dispatch action to open modal
    dispatch(toggleTransactModal())
  }

  return (
    <header className="sticky top-0 z-[5] w-full border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-[0.5rem] lg:px-[1rem]">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-gray-700 dark:text-gray-200">
            Labscro
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-[0.5rem]">
          <div className="w-[3rem]">
            <ThemeToggle />
          </div>

          <Button
            onClick={handleOpenTransactModal}
            variant="ghost"
            className="w-full justify-start bg-primary text-white hover:opacity-[0.77] hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Transact
          </Button>
          <div className="w-[2.5rem]">
            <div className="grid w-[2.2rem] h-[2.2rem] cursor-pointer hover:opacity-[0.75] justify-center place-items-center rounded-full  bg-gray-700 text-white font-semibold">
              <p>F</p>
            </div>
          </div>
          {session ? (
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          ) : (
            <Link href="/auth">
              <Button className="bg-primary text-[#fff] hover:bg-primary/70">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
