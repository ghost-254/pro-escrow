'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Typography from '../ui/typography'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

function Header() {
  const balance: number = 1250.75 // Example balance; replace with dynamic value

  const handleDeposit = () => {
    alert('Deposit clicked')
  }

  const handleWithdrawal = () => {
    alert('Withdrawal clicked')
  }

  return (
    <div className="flex items-center justify-between px-[1rem] py-[0.5rem] bg-background/95 border-b">
      <div className="flex flex-col gap-[0.5rem]">
        <div className="flex items-center gap-[0.5rem]">
          <Typography variant="p" className='font-semibold'>Funding:</Typography>
          {/* Payment Method Dropdown */}
          <div className="flex items-center space-x-4">
            <Select defaultValue="binance">
              <SelectTrigger className="w-[7rem] font-bold">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="mpesa">MPesa</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Balance Section */}
        <div className="flex items-center space-x-2">
          <Typography variant="p" className='font-semibold'>Balance:</Typography>
          <Typography variant="h1" className='text-[1.1rem] font-bold dark:text-white'>{`USD ${balance.toFixed(2)}`}</Typography>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="flex space-x-4">
        <Button
          onClick={handleDeposit}
          variant={'secondary'}
          className="text-white"
        >
          Add Funds
        </Button>
        <Button onClick={handleWithdrawal} variant={'destructive'}>
          Withdraw
        </Button>
      </div>
    </div>
  )
}

export default Header
