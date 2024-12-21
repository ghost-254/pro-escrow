'use client'
import React from 'react'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ListingFilters() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-8" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
            <SelectItem value="domain">Domains</SelectItem>
            <SelectItem value="website">Websites</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline">Price: Low to High</Button>
        <Button variant="outline">Highest Rating</Button>
      </div>
    </div>
  )
}
