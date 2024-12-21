"use client"
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebars/sidebar'

export const SidebarVisibility = ({ children }) => {
  const pathname = usePathname()

  const isSidebarVisible = pathname !== '/groups'

  return (
    <div className="h-full w-full flex flex-1">
      {isSidebarVisible && (
        <div className="flex-[0.25]">
          <Sidebar />
        </div>
      )}
      <div className={`h-full w-full ${isSidebarVisible ? 'md:flex-[0.75]' : 'flex-1'}`}>
        {children}
      </div>
    </div>
  )
}
