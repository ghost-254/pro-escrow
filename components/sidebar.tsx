'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Home,
  History,
  Wallet,
  HelpCircle,
  Shield,
  BadgeCheck,
  AlertCircle,
  X,
  CreditCard,
  Bell,
  User,
  Users,
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toggleTransactModal } from '@/lib/slices/transact.reducer'
import Typography from './ui/typography'

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const dispatch = useDispatch()

  const handleShowTransactModal = () => {
    dispatch(toggleTransactModal())
    if (isMobile && onClose) onClose()
  }

  // A reusable MenuItem
  const MenuItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string
    icon: React.ElementType
    label: string
  }) => {
    const isActive = href === pathname

    // We'll check if it's specifically the "/groups" link
    const isGroupsLink = href === '/groups'

    return (
      <Link href={href} onClick={isMobile ? onClose : undefined}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start relative', // relative for possible badge
            isActive &&
              'bg-[#dddddd] dark:bg-gray-600 font-semibold hover:bg-[#dddddd] hover:dark:bg-gray-600'
          )}
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
          {/* Show green "NEW" badge ONLY for /groups item */}
          {isGroupsLink && (
            <span
              className="
                absolute
                top-2
                right-4
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
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1">
        {/* Header (Sticky at top) */}
        <div className="sticky top-0 z-10 bg-muted border-b p-4">
          {isMobile && (
            <div className="flex items-center justify-between mb-4">
              <Typography variant="span">Menu</Typography>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleShowTransactModal}
            className="w-full justify-start bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Xcrow Group
          </Button>
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
            <nav className="space-y-1 flex flex-col gap-[0.3rem]">
              <MenuItem href="/orders" icon={Shield} label="Active Escrows" />
              <MenuItem href="/orders" icon={BadgeCheck} label="Completed" />
              <MenuItem href="/orders" icon={AlertCircle} label="Disputes" />
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
              <MenuItem href="/profile" icon={User} label="Profile" />
              {/* <MenuItem href="/security" icon={Lock} label="Security" />
              <MenuItem href="/referrals" icon={Gift} label="Referrals" />*/}
            </nav>
          </div>
        </div>

        {/* Footer (Sticky at bottom) */}
        <div className="sticky bottom-0 mb-0 z-50 bg-muted border-t p-4 space-y-1">
          {/* <MenuItem href="/settings" icon={Settings} label="Settings" /> */}
          <MenuItem href="/support" icon={HelpCircle} label="Support" />
        </div>
      </ScrollArea>
    </div>
  )
}
