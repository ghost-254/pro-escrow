import React from 'react'
import Typography from '../ui/typography'
import Search from '../search/Search'

function Header() {
  return (
    <div className="flex items-center justify-between p-[1rem]">
      <div className="flex items-center gap-[1rem]">
        <Typography variant="h1" className="font-bold whitespace-nowrap">
          Notifications
        </Typography>
        <div className="relative">
          <Search />
        </div>
      </div>
      <Typography
        variant="p"
        className="font-medium cursor-pointer hover:opacity-[0.75]"
      >
        Mark All as Read
      </Typography>
    </div>
  )
}

export default Header
