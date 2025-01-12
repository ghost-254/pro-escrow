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
import { Plus } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toggleAddFundsModal } from '@/app/global.redux/stores/reducers/addfunds.reducer'

function Header() {
  const dispatch = useDispatch()

  const openAddfundsModal = () => {
    dispatch(toggleAddFundsModal())
  }

  const balance: number = 1250.75 // Example balance; replace with dynamic value

  const handleDeposit = () => {
    openAddfundsModal()
  }

  const handleWithdrawal = () => {
    alert('Withdrawal clicked')
  }

  return (
    <div className="flex items-center justify-between px-[1rem] py-[0.5rem] bg-background/95 border-b">
      <div className="flex flex-col gap-[0.5rem]">
        <div className="flex items-center gap-[0.5rem]">
          <Typography variant="p" className="font-semibold">
            Funding:
          </Typography>
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
        <div className="flex flex-col">
          {/* Balance Section */}
          <div className="flex items-center space-x-2">
            <Typography variant="p" className="font-semibold">
              Balance:
            </Typography>
            <Typography
              variant="h1"
              className="text-[1.1rem] font-bold dark:text-white"
            >{`USD ${balance.toFixed(2)}`}</Typography>
          </div>
          <div className="flex items-center gap-[0.5rem]">
            <Typography
              variant="span"
              className="font-medium dark:text-gray-700 text-gray-500 "
            >
              Unavailable:
            </Typography>
            <Typography
              variant="span"
              className="font-bold dark:text-gray-700 text-gray-500"
            >
              USD 20.00
            </Typography>
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="flex space-x-4">
        <Button
          onClick={handleDeposit}
          variant={'secondary'}
          className="text-white flex items-center"
        >
          <Plus className="w-3 h-3" />
          <p>Add Funds</p>
        </Button>

        <Button onClick={handleWithdrawal} variant={'destructive'}>
          Withdraw
        </Button>
      </div>
    </div>
  )
}

export default Header
