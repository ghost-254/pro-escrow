'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Bell, User, Headphones, History, Users } from 'lucide-react'
// import { useSelector } from 'react-redux'
// import { RootState } from '../app/GlobalRedux/stores/store'
import { success } from '../ui/color'

export function Sidebar() {
  const pathname = usePathname()

  // const open = useSelector((state: RootState) => state.transact.open)
  // console.log(open)

  return (
    <div className="w-full h-screen bg-muted p-2 hidden md:block">
      <div className="h-full flex flex-col justify-between">
        <nav className="space-y-2 flex flex-col gap-[0.1rem]">
          <div className="w-full pb-[1rem] border-b-[1px] border-[#dbdbdb] dark:border-[#4b4b4b]">
            <Button
              title="Transact"
              variant="ghost"
              className="w-full justify-start bg-primary text-white hover:text-white hover:opacity-[0.77] hover:bg-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Transact
            </Button>
          </div>

          {/* Home Button */}
          {/* <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-gray-700 dark:text-gray-200", // Text color based on mode
                pathname === "/" 
                  ? "bg-gray-600 text-gray-200 dark:bg-gray-800 dark:text-gray-50" // Active styles
                  : "hover:text-gray-800 hover:bg-gray-200 focus:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700 focus:text-primary" // Hover & focus styles
              )}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link> */}
          <Link href="/groups">
            <div className="relative">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-gray-700 dark:text-gray-200',
                  pathname === '/groups'
                    ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white'
                    : 'hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                Groups
              </Button>
              <p
                style={{
                  background: `${success[600]}`,
                  padding: '0.1rem 0.3rem',
                  borderRadius: '5px',
                }}
                className="absolute top-[0.55rem] font-bold left-[6.5rem] text-[0.65rem] text-white"
              >
                New
              </p>
            </div>
          </Link>
          {/* Orders Button */}
          <Link href="/orders">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-gray-700 dark:text-gray-200',
                pathname === '/orders'
                  ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white'
                  : 'hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <Bell className="mr-2 h-4 w-4" />
              Orders
            </Button>
          </Link>

          {/* History Button */}
          <Link href="/history">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-gray-700 dark:text-gray-200',
                pathname === '/history'
                  ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white'
                  : 'hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>

          {/* Profile Button */}
          <Link href="/profile">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-gray-700 dark:text-gray-200',
                pathname === '/profile'
                  ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white'
                  : 'hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </nav>

        <div className="mb-[5rem]">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-gray-700 dark:text-gray-200',
              pathname === '/Support'
                ? 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white'
                : 'hover:text-gray-800 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <Headphones className="mr-2 h-4 w-4" />
            Support
          </Button>
        </div>
      </div>
    </div>
  )
}
