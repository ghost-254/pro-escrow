// components/mobile-sidebar.tsx

'use client'

import React, { useEffect, useState, MouseEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebaseConfig'
import { signOut } from 'firebase/auth'
import {
  X,
  LogOut,
  Plus,
  Home,
  History,
  Wallet,
  CreditCard,
  Bell,
  Shield,
  BadgeCheck,
  AlertCircle,
  Lock,
  HelpCircle,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleTransactModal } from '@/lib/slices/transact.reducer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import Image from 'next/image'
import truncate from '@/lib/truncate'
import Typography from './ui/typography'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()

  const router = useRouter()
  const userFromRedux = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()

  // Initialize toast
  const { toast } = useToast()

  const [firstName, setFirstName] = useState('User')
  const [lastName, setLastName] = useState('')
  const [photoURL, setPhotoURL] = useState('')

  // Hide/show bottom nav based on isOpen
  useEffect(() => {
    const bottomNavEl = document.getElementById('bottom-nav')
    if (!bottomNavEl) return
    bottomNavEl.style.display = isOpen ? 'none' : ''
  }, [isOpen])

  // Fetch user doc from Firestore
  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!userFromRedux?.uid) return
      try {
        const docRef = doc(db, 'users', userFromRedux.uid)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          setFirstName(data.firstName || 'User')
          setLastName(data.lastName || '')
          setPhotoURL(data.photoURL || '')
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching user data',
          description:
            error instanceof Error
              ? error.message
              : 'Something went wrong while fetching user data.',
        })
      }
    }
    fetchUserDoc()
  }, [toast, userFromRedux?.uid])

  // Generate fallback initials
  const initials = (firstName[0] || '') + (lastName[0] || '')
  const userInitials = initials.toUpperCase()

  if (!isOpen) return null

  // Prevent overlay close on sidebar clicks
  const stopPropagation = (e: MouseEvent) => {
    e.stopPropagation()
  }

  const handleShowTransactModal = () => {
    dispatch(toggleTransactModal())
    onClose()
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      onClose()
      router.push('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error logging out',
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong while logging out.',
      })
    }
  }

  // Reusable link item
  const MenuItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string
    icon: React.ElementType
    label: string
  }) => (
    <Link href={href} onClick={onClose}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start',
          href === pathname && 'bg-[#dddddd] dark:bg-gray-600  font-semibold'
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Link>
  )

  return (
    <div className="fixed inset-0 z-[15] flex bg-black/50" onClick={onClose}>
      {/* Sidebar Panel */}
      <div
        className="relative w-[70%] md:w-[50%] h-screen bg-muted flex flex-col"
        onClick={stopPropagation}
      >
        {/* Sticky Top Section */}
        <div className="sticky top-0 z-10 bg-muted border-b md:p-4 p-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          {userFromRedux ? (
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center space-x-2">
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt="Profile Avatar"
                    width={120}
                    height={120}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-100">
                    {userInitials || 'U'}
                  </div>
                )}
                <Typography variant="span">
                  {truncate(firstName, 15)}
                </Typography>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:bg-destructive/20"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-3 px-2">
              <Link href="/auth">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Create Xcrow Group */}
          <Button
            onClick={handleShowTransactModal}
            className="w-full justify-start bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Xcrow Group
          </Button>
        </div>

        {/* Scrollable Middle Section */}
        <ScrollArea className="flex-1">
          <div className="md:p-4 p-2 space-y-4">
            {/* MAIN MENU */}
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                MAIN MENU
              </h4>
              <nav className="space-y-1">
                <MenuItem href="/" icon={Home} label="Dashboard" />
                <MenuItem href="/groups" icon={Users} label="Chats" />
                <MenuItem
                  href="/transactions"
                  icon={CreditCard}
                  label="Transactions"
                />
                <MenuItem href="/wallet" icon={Wallet} label="Wallet" />
                <MenuItem
                  href="/notifications"
                  icon={Bell}
                  label="Notifications"
                />
                <MenuItem href="/history" icon={History} label="History" />
              </nav>
            </div>

            {/* ESCROW SERVICES */}
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                ESCROW SERVICES
              </h4>
              <nav className="space-y-1">
                <MenuItem
                  href="/active-escrows"
                  icon={Shield}
                  label="Active Escrows"
                />
                <MenuItem
                  href="/completed"
                  icon={BadgeCheck}
                  label="Completed"
                />
                <MenuItem
                  href="/disputes"
                  icon={AlertCircle}
                  label="Disputes"
                />
              </nav>
            </div>

            {/* TOOLS & REPORTS 
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                TOOLS & REPORTS
              </h4>
              <nav className="space-y-1">
                <MenuItem href="/analytics" icon={BarChart3} label="Analytics" />
                <MenuItem href="/documents" icon={FileText} label="Documents" />
                <MenuItem href="/vpns-proxies" icon={Zap} label="VPNs & Proxies" />
              </nav>
            </div>

            */}

            {/* ACCOUNT */}
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                ACCOUNT
              </h4>
              <nav className="space-y-1">
                <MenuItem href="/profile" icon={Lock} label="Profile" />
                {/*<MenuItem href="/security" icon={Lock} label="Security" />
                <MenuItem href="/referrals" icon={Gift} label="Referrals" />*/}
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="flex-none border-t md:p-4 p-2 bg-muted space-y-1">
          {/*<MenuItem href="/settings" icon={Settings} label="Settings" />*/}
          <MenuItem href="/support" icon={HelpCircle} label="Support" />
        </div>
      </div>
    </div>
  )
}
