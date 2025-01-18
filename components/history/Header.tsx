import React from 'react'
import Typography from '../ui/typography'
import Search from '../search/Search'

function Header() {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center gap-[0.5rem] justify-between lg:p-[1rem] p-[0.5rem]">
      <div className="flex flex-col md:flex-row md:items-center gap-[0.5rem] md:gap-[1rem]">
        <Typography
          variant="h1"
          className="font-bold whitespace-nowrap dark:text-white"
        >
          Notifications
        </Typography>
        <div className="relative md:w-auto w-full">
          <Search />
        </div>
      </div>
      <Typography
        variant="p"
        className="absolute top-[0.7rem] right-[0.5rem] md:top-[1rem] lg:relative font-medium cursor-pointer hover:opacity-[0.75]"
      >
        Mark All as Read
      </Typography>
    </div>
  )
}

export default Header
