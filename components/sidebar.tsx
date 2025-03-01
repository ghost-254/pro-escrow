"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Home,
  Wallet,
  HelpCircle,
  Bell,
  User,
  Users,
  Mails,
  FileText,
  Shield,
  RefreshCcw,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { toggleTransactModal } from "@/lib/slices/transact.reducer"
import { db } from "@/lib/firebaseConfig"
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore"

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const { theme } = useTheme()

  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Decide which logo to show
  const logoSrc =
    theme === "dark"
      ? "/logo11X.png" // Dark mode logo
      : "/logo11xx.png" // Light mode logo

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
      orderBy("createdAt", "desc"),
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
    onClick,
  }: {
    href: string
    icon: React.ElementType
    label: string
    showNewBadge?: boolean
    isNotifications?: boolean
    onClick?: () => void
  }) => {
    const isActive = href === pathname

    return (
      <Link
        href={href}
        onClick={() => {
          if (onClick) onClick()
          if (isMobile && onClose) onClose()
        }}
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start relative",
            isActive && "bg-[#dddddd] dark:bg-gray-600 font-semibold hover:bg-[#dddddd] hover:dark:bg-gray-600",
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex justify-left items-center p-4 border-b h-14">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image
            src={logoSrc || "/placeholder.svg"}
            alt="Xcrow Logo"
            width={90}
            height={85}
            className="object-contain"
            priority
          />
          <span className="sr-only">Xcrow</span>
        </Link>
      </div>

      {/* Create Xcrow Group Button */}
      <div className="p-4 border-b">
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

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* MAIN MENU */}
          <div>
            <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">MAIN MENU</h4>
            <nav className="space-y-1 flex flex-col gap-[0.3rem]">
              <MenuItem href="/dashboard" icon={Home} label="Dashboard" />
              <MenuItem href="/dashboard/group-chat" icon={Users} label="Group Chats" showNewBadge />
              <MenuItem href="/dashboard/notifications" icon={Bell} label="Notifications" isNotifications />
            </nav>
          </div>

          {/* ACCOUNT */}
          <div>
            <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">ACCOUNT</h4>
            <nav className="space-y-1">
              <MenuItem href="/dashboard/profile" icon={User} label="Profile" />
              <MenuItem href="/dashboard/wallet" icon={Wallet} label="My Wallet" />
              <MenuItem href="/dashboard/support" icon={HelpCircle} label="Support" />
            </nav>
          </div>

          {/* ESSENTIALS */}
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

      {/* Footer */}
      <div className="p-4 border-t mt-auto">
        <MenuItem href="mailto:support@xcrow.co" icon={Mails} label="support@xcrow.co" />
        <div className="mt-2 text-xs text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Xcrow.co</p>
        </div>
      </div>
    </div>
  )
}
