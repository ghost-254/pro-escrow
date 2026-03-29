"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { BrandLogo } from "@/components/brand-logo"
import { triggerPageTransitionLoader } from "@/components/page-transition-loader"

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

interface MenuItemProps {
  href: string
  icon: React.ElementType
  label: string
  showNewBadge?: boolean
  isNotifications?: boolean
  showRouteLoader?: boolean
  onClick?: () => void
  pathname: string
  isMobile?: boolean
  onClose?: () => void
  unreadCount?: number
}

function MenuItem({
  href,
  icon: Icon,
  label,
  showNewBadge = false,
  isNotifications = false,
  showRouteLoader = false,
  onClick,
  pathname,
  isMobile = false,
  onClose,
  unreadCount = 0,
}: MenuItemProps) {
  const isActive = href === pathname

  return (
    <Link
      href={href}
      onClick={() => {
        if (showRouteLoader && href.startsWith("/") && href !== pathname) {
          triggerPageTransitionLoader()
        }
        if (onClick) onClick()
        if (isMobile && onClose) onClose()
      }}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start relative",
          isActive && "bg-[#dddddd] dark:bg-gray-600 font-semibold hover:bg-[#dddddd] hover:dark:bg-gray-600"
        )}
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

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const [unreadCount, setUnreadCount] = useState<number>(0)

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-left border-b p-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <BrandLogo width={90} height={85} priority />
          <span className="sr-only">Xcrow</span>
        </Link>
      </div>

      <div className="border-b p-4">
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
              <MenuItem href="/dashboard" icon={Home} label="Dashboard" showRouteLoader pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem href="/dashboard/group-chat" icon={Users} label="Group Chats" showNewBadge showRouteLoader pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem
                href="/dashboard/notifications"
                icon={Bell}
                label="Notifications"
                isNotifications
                showRouteLoader
                pathname={pathname}
                isMobile={isMobile}
                onClose={onClose}
                unreadCount={unreadCount}
              />
            </nav>
          </div>

          <div>
            <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">ACCOUNT</h4>
            <nav className="space-y-1">
              <MenuItem href="/dashboard/profile" icon={User} label="Profile" showRouteLoader pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem href="/dashboard/wallet" icon={Wallet} label="My Wallet" showRouteLoader pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem href="/dashboard/support" icon={HelpCircle} label="Support" showRouteLoader pathname={pathname} isMobile={isMobile} onClose={onClose} />
            </nav>
          </div>

          <div>
            <h4 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">ESSENTIALS</h4>
            <nav className="space-y-1">
              <MenuItem href="/terms" icon={FileText} label="Terms of Service" pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem href="/privacy" icon={Shield} label="Privacy Policy" pathname={pathname} isMobile={isMobile} onClose={onClose} />
              <MenuItem href="/refund" icon={RefreshCcw} label="Refund Policy" pathname={pathname} isMobile={isMobile} onClose={onClose} />
            </nav>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-auto border-t p-4">
        <MenuItem
          href="mailto:support@xcrowtrust.com"
          icon={Mails}
          label="support@xcrowtrust.com"
          pathname={pathname}
          isMobile={isMobile}
          onClose={onClose}
        />
        <div className="mt-2 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} XcrowTrust.com</p>
        </div>
      </div>
    </div>
  )
}
