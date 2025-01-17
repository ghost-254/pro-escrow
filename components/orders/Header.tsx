'use client'
import React, { useState } from 'react'
import clsx from 'clsx' // Ensure clsx is installed: npm install clsx
import Typography from '../ui/typography'
import Search from '../search/Search'

interface OrderFilter {
  id: number
  name: string
}

const Header: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>('All')

  const orderFilters: OrderFilter[] = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Pending' },
    { id: 3, name: 'Completed' },
    { id: 4, name: 'Refunded' },
  ]

  return (
    <div className="w-full flex flex-col gap-[1rem]">
      {/* Header Section */}
      <div className="hidden lg:block ">
        <div className="w-full flex justify-between items-center lg:p-[1rem] p-[0.5rem]">
          <Typography variant="h1" className="font-bold dark:text-white">
            Orders
          </Typography>
          <Typography variant="p" className='font-bold'>Jan 23 23:06</Typography>
        </div>
      </div>

      <div className="w-full bg-red-600 flex flex-col md:flex-row items-center justify-between lg:px-[1rem] px-[0.5rem]">
        {/* Filter Section */}
        <div className="mt-[0.5rem] lg:mt-0">
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
        <div className="relative mt-[0.5rem] lg:mt-0">
          <Search />
        </div>
      </div>
    </div>
  )
}

export default Header
