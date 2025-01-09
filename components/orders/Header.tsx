'use client'
import React, { useState } from 'react'
import clsx from 'clsx' // Ensure clsx is installed: npm install clsx
import Typography from '../ui/typography'
import { Input } from '../ui/input'
import { Search } from 'lucide-react'

interface OrderFilter {
  id: number
  name: string
}

const Header: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>('All')
  const [search, setSearch] = useState<string>('')

  const orderFilters: OrderFilter[] = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Pending' },
    { id: 3, name: 'Completed' },
    { id: 4, name: 'Refunded' },
  ]

  return (
    <div className="w-full flex flex-col gap-[1rem]">
      {/* Header Section */}
      <div className="w-full flex justify-between items-center p-[1rem]">
        <Typography variant="h1" className="font-bold">
          Orders
        </Typography>
        <Typography variant="p">Jan 23 23:06</Typography>
      </div>

      <div className="flex items-center justify-between px-[1rem]">
        {/* Filter Section */}
        <div className="filter-section">
          <div className="flex items-center gap-[0.5rem]">
            {orderFilters.map((filter) => (
              <div
                key={filter.id}
                onClick={() => setSelectedFilter(filter.name)}
                className={clsx(
                  'text-sm capitalize bg-gray-100 dark:bg-gray-800 dark:text-white text-gray-500 rounded-md py-2 px-4 font-medium cursor-pointer hover:opacity-75',
                  selectedFilter === filter.name &&
                    '!bg-gray-300 !text-black font-bold dark:!bg-gray-200 dark:!text-gray-800'
                )}
              >
                {filter.name}
              </div>
            ))}
          </div>
        </div>
        {/* Search by name section */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
          <Search className="w-4 h-4 absolute right-[1rem] top-[0.6rem]" />
        </div>
      </div>
    </div>
  )
}

export default Header
