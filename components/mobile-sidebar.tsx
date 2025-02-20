// components/mobile-sidebar.tsx

/* eslint-disable */

'use client'

import React, { useEffect, useState, MouseEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { doc, getDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db, auth } from '@/lib/firebaseConfig'
import { signOut } from 'firebase/auth'
import {
  X,
  LogOut,
  Plus,
  Home,
  Wallet,
  Bell,
  Shield,
  BadgeCheck,
  AlertCircle,
  User,
  Mails,
  HelpCircle,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleTransactModal } from '@/lib/slices/transact.reducer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'react-toastify'
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
  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()
  const [firstName, setFirstName] = useState('User')
  const [lastName, setLastName] = useState('')
  const [photoURL, setPhotoURL] = useState('')

  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Real-time unread notifications for the user
  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const notifsRef = collection(db, 'notifications')
    const notificationsQuery = query(
      notifsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadCount(snapshot.size)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.uid])

  // Fetch user document from Firestore
  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!user?.uid) return
      try {
        const docRef = doc(db, 'users', user.uid)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          const data = snapshot.data()
          setFirstName(data.firstName || 'User')
          setLastName(data.lastName || '')
          setPhotoURL(data.photoURL || '')
        }
      } catch {
        toast.error('Something went wrong while fetching user data.')
      }
    }
    fetchUserDoc()
  }, [user?.uid])

  // Generate fallback initials if no photo is provided
  const initials = (firstName[0] || '') + (lastName[0] || '')
  const userInitials = initials.toUpperCase()

  if (!isOpen) return null

  // Prevent overlay close when clicking inside the sidebar
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
    } catch {
      toast.error('Something went wrong while logging out.')
    }
  }

  // Reusable MenuItem component with support for notifications and NEW badges
  const MenuItem = ({
    href,
    icon: Icon,
    label,
    showNewBadge = false,
    isNotifications = false,
  }: {
    href: string
    icon: React.ElementType
    label: string
    showNewBadge?: boolean
    isNotifications?: boolean
  }) => {
    const isActive = href === pathname

    return (
      <Link href={href} onClick={onClose}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start relative',
            isActive && 'bg-[#dddddd] dark:bg-gray-600 font-semibold'
          )}
        >
          <Icon className="mr-2 h-4 w-4" />
          <span className="flex items-center">
            {label}
            {isNotifications && unreadCount > 0 && (
              <span
                className="
                  ml-2
                  flex
                  items-center
                  justify-center
                  h-5
                  w-5
                  text-[0.7rem]
                  rounded-full
                  font-bold
                  bg-red-600
                  text-white
                "
              >
                {unreadCount}
              </span>
            )}
          </span>
          {showNewBadge && (
            <span
              className="
                ml-2
                text-[0.6rem]
                px-1
                rounded
                font-bold
                bg-green-600
                text-white
              "
            >
              NEW
            </span>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[15] flex bg-black/50"
      onClick={onClose}
    >
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
          {user ? (
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
          <Link href="/create-group">
            <Button
              onClick={handleShowTransactModal}
              className="w-full justify-start bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Xcrow Group
            </Button>
          </Link>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* MAIN MENU */}
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                MAIN MENU
              </h4>
              <nav className="space-y-1 flex flex-col gap-[0.3rem]">
                <MenuItem href="/" icon={Home} label="Dashboard" />
                <MenuItem
                  href="/group-chat"
                  icon={Users}
                  label="Group Chats"
                  showNewBadge
                />
                <MenuItem
                  href="/notifications"
                  icon={Bell}
                  label="Notifications"
                  isNotifications
                />
              </nav>
            </div>

            {/* ESCROW SERVICES 
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                ESCROW SERVICES
              </h4>
              <nav className="space-y-1 flex flex-col gap-[0.3rem]">
                <MenuItem href="/orders" icon={Shield} label="Active Escrows" />
                <MenuItem href="/completed" icon={BadgeCheck} label="Completed" />
                <MenuItem href="/disputes" icon={AlertCircle} label="Disputes" />
              </nav>
            </div>
            */}

            {/* ACCOUNT */}
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
                ACCOUNT
              </h4>
              <nav className="space-y-1">
                <MenuItem href="/profile" icon={User} label="Profile" />
                <MenuItem href="/wallet" icon={Wallet} label="My Wallet" />
                <MenuItem href="/support" icon={HelpCircle} label="Support" />
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="sticky bottom-0 mb-0 z-50 bg-muted border-t p-4 space-y-1 overflow-hidden">
          <MenuItem href="mailto:support@xcrow.co" icon={Mails} label="support@xcrow.co" />
        </div>
      </div>
    </div>
  )
}
