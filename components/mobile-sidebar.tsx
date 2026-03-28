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
  RefreshCcw,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearServerSession } from '@/lib/clientAuthSession'
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

  useEffect(() => {
    if (!user?.uid) {
      return undefined
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

  const initials = (firstName[0] || '') + (lastName[0] || '')
  const userInitials = initials.toUpperCase()

  if (!isOpen) return null

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
      await clearServerSession().catch(() => null)
      onClose()
      router.push('/')
    } catch {
      toast.error('Something went wrong while logging out.')
    }
  }

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
          className={cn('w-full justify-start relative', isActive && 'bg-[#dddddd] dark:bg-gray-600 font-semibold')}
        >
          <Icon className="mr-2 h-4 w-4" />
          <span className="flex items-center">
            {label}
            {isNotifications && unreadCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[0.7rem] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </span>
          {showNewBadge && (
            <span className="ml-2 rounded bg-green-600 px-1 text-[0.6rem] font-bold text-white">
              NEW
            </span>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <div className="fixed inset-0 z-[15] flex bg-black/50" onClick={onClose}>
      <div
        className="relative h-screen w-[70%] flex-col bg-muted md:w-[50%]"
        onClick={stopPropagation}
      >
        <div className="sticky top-0 z-10 border-b bg-muted p-2 md:p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {user ? (
            <div className="mb-3 flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt="Profile Avatar"
                    width={120}
                    height={120}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-700 dark:bg-gray-600 dark:text-gray-100">
                    {userInitials || 'U'}
                  </div>
                )}
                <Typography variant="span">{truncate(firstName, 15)}</Typography>
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
            <div className="mb-3 flex items-center justify-between px-2">
              <Link href="/auth">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          <Link href="/dashboard/create-group">
            <Button
              onClick={handleShowTransactModal}
              className="w-full justify-start bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Xcrow Group
            </Button>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">MAIN MENU</h4>
              <nav className="flex flex-col gap-[0.3rem] space-y-1">
                <MenuItem href="/dashboard" icon={Home} label="Dashboard" />
                <MenuItem href="/dashboard/group-chat" icon={Users} label="Group Chats" showNewBadge />
                <MenuItem
                  href="/dashboard/notifications"
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
                <MenuItem href="/dashboard/orders" icon={Shield} label="Active Escrows" />
                <MenuItem href="/dashboard/completed" icon={BadgeCheck} label="Completed" />
                <MenuItem href="/dashboard/disputes" icon={AlertCircle} label="Disputes" />
              </nav>
            </div>
            */}

            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">ACCOUNT</h4>
              <nav className="space-y-1">
                <MenuItem href="/dashboard/profile" icon={User} label="Profile" />
                <MenuItem href="/dashboard/wallet" icon={Wallet} label="My Wallet" />
                <MenuItem href="/dashboard/support" icon={HelpCircle} label="Support" />
              </nav>
            </div>

            <div>
              <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">ESSENTIALS</h4>
              <nav className="space-y-1">
                <MenuItem href="/terms" icon={FileText} label="Terms of Service" />
                <MenuItem href="/privacy" icon={Shield} label="Privacy Policy" />
                <MenuItem href="/refund" icon={RefreshCcw} label="Refund Policy" />
              </nav>
            </div>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-50 mb-0 overflow-hidden border-t bg-muted p-4 space-y-1">
          <MenuItem
            href="mailto:support@xcrowtrust.com"
            icon={Mails}
            label="support@xcrowtrust.com"
          />
          <div className="mt-2 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} XcrowTrust.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
