import React from 'react'
import { Button } from '@/components/ui/button'
import { Power, ClipboardList, X } from 'lucide-react'
function Header() {
  return (
    <div className="w-full relative bg-background z-[2] border-b-[1px] border-[#f0f0f0] dark:border-[#202020]">
      <div
        style={{ padding: ' 0.5rem' }}
        className="w-full flex justify-between"
      >
        <div className="flex gap-[0.5rem]">
          <div>
            <button
              title="Report"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
          <h2 className="dark:text-gray-400 text-gray-800 font-medium max-w-[90%] text-sm">
            USD 1000 -Buying Chat Home Base, Text Factory and Screening Buying
            Chat Home Base, Text Factory and Screening
          </h2>
        </div>

        <div>
          <div className="w-full flex gap-[0.5rem] items-center">
            <button
              title="Orders"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <Button variant="secondary" className="text-white">
              Release Funds
            </Button>
            <button
              title="Close"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
