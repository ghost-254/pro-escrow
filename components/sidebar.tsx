"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Home,
  Wallet,
  HelpCircle,
  Shield,
  BadgeCheck,
  AlertCircle,
  X,
  Bell,
  User,
  Users,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { toggleTransactModal } from "@/lib/slices/transact.reducer"
import Typography from "@/components/ui/typography"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore"

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Real-time unread notifications for this user
  useEffect(() => {
    if (!user?.uid) {
      return () => {
        /* no cleanup needed when user is not available */
      }
    }

    const notifsRef = collection(db, "notifications")
    const notificationsQuery = query(
      notifsRef,
      where("userId", "==", user.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadCount(snapshot.size)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.uid])

  const handleShowTransactModal = () => {
    dispatch(toggleTransactModal())
    if (isMobile && onClose) onClose()
  }

  // Reusable link item
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
      <Link href={href} onClick={isMobile ? onClose : undefined}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start relative",
            isActive &&
              "bg-[#dddddd] dark:bg-gray-600 font-semibold hover:bg-[#dddddd] hover:dark:bg-gray-600"
          )}
        >
          <Icon className="mr-2 h-4 w-4" />
          <span className="flex items-center">
            {label}
            {/* Show unread notifications count if it's the Notifications menu */}
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

          {/* Optionally show a "NEW" badge (e.g. for group chats) */}
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
    <div className="flex flex-col h-full mb-[5rem] overflow-hidden">
      <ScrollArea className="flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-muted border-b p-4">
          {isMobile && (
            <div className="flex items-center justify-between mb-4">
              <Typography variant="span">Menu</Typography>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

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
              <MenuItem href="/wallet" icon={Wallet} label="My Wallet" />
              <MenuItem
                href="/notifications"
                icon={Bell}
                label="Notifications"
                isNotifications
              />
            </nav>
          </div>

          {/* ESCROW SERVICES */}
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

          {/* ACCOUNT */}
          <div>
            <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
              ACCOUNT
            </h4>
            <nav className="space-y-1">
              <MenuItem href="/profile" icon={User} label="Profile" />
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 mb-0 z-50 bg-muted border-t p-4 space-y-1">
          <MenuItem href="/support" icon={HelpCircle} label="Support" />
        </div>
      </ScrollArea>
    </div>
  )
}
