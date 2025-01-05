'use client'

import React, { useState } from 'react'
import Typography from '../ui/typography'
import { X } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toggleTransactModal } from '@/app/global.redux/stores/reducers/transact.reducer'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/select'
import { Input } from '../ui/input'
import clsx from 'clsx'
import { Button } from '../ui/button'

function Transact() {
  interface Role {
    id: string
    name: string
  }
  interface PAYMENTS {
    id: number
    name: string
  }
  interface CURRENCY {
    id: string
    label: string
  }

  const roles: Role[] = [
    { id: '1', name: 'buyer' },
    { id: '2', name: 'seller' },
  ]

  const currencies: CURRENCY[] = [
    { id: 'usd', label: 'USD' },
    { id: 'eur', label: 'EUR' },
    { id: 'gbp', label: 'GBP' },
    { id: 'kes', label: 'KES' },
  ]
  const payments: PAYMENTS[] = [
    {
      id: 1,
      name: 'Binance',
    },
    {
      id: 2,
      name: 'Paypal',
    },
    {
      id: 3,
      name: 'Airtm',
    },
    {
      id: 4,
      name: 'Mpesa',
    },
  ]

  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('usd')
  const [amount, setAmount] = useState<string>('')
  const [invitee, setInvitee] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [checkTime, setcheckTime] = useState<string>('')

  const dispatch = useDispatch()

  const handleCloseModal = () => {
    dispatch(toggleTransactModal())
  }

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
  }

  const handlePaymentSelect = (payment: string) => {
    setSelectedPayment(payment)
  }

  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value)
  }

  return (
    <div className="w-full">
      <div className="w-full top-0 sticky z-[2] bg-background flex px-[1rem] py-[1rem] justify-between border-b-[1px] border-[#f0f0f0] dark:border-[#202020]">
        <Typography variant="h2" className="font-bold">
          Create Escrow
        </Typography>
        <button
          onClick={handleCloseModal}
          title="Close"
          className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full relative flex flex-col gap-[1rem] px-[1rem] py-[1rem]">
        <div className="w-full flex flex-col gap-[0.5rem]">
          <Typography variant="p" className="font-bold">
            My Role
          </Typography>
          <div className="flex items-center gap-[1rem]">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role?.name)}
                className={`text-sm px-[1rem] capitalize py-[0.5rem] rounded-md font-medium hover:opacity-[0.77] cursor-pointer ${
                  selectedRole === role?.name
                    ? role.name === 'buyer'
                      ? 'bg-[#cbf1de] text-[#2da966] dark:bg-[#2da966] dark:text-[#fff]'
                      : 'bg-[#f1d9d9] text-[#ff4f4f] dark:bg-[#ff4f4f] dark:text-[#fff]'
                    : 'bg-gray-100 text-[#999999] dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {role?.name}
              </div>
            ))}
          </div>
        </div>

        {selectedRole && (
          <div className="w-full flex flex-col gap-[0.5rem]">
            <Typography
              variant="p"
              className="font-bold"
            >{`Invite ${selectedRole === 'buyer' ? 'Seller' : 'Buyer'}`}</Typography>
            <Input
              type="text"
              placeholder={`Enter ${selectedRole === 'buyer' ? "Seller's" : "Buyer's"} UID or email`}
              value={invitee}
              onChange={(e) => setInvitee(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        <div className="w-full flex flex-col gap-[0.5rem]">
          <Typography variant="p" className="font-bold">
            Transaction Title
          </Typography>
          <div className="flex items-center gap-[0.5rem]">
            <Input
              type="text"
              placeholder="Enter transaction title (e.g., KYC, Verification, Remote Task)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-[1rem]">
          <Typography variant="p" className="font-bold">
            Amount
          </Typography>
          <div className="flex items-center gap-[0.5rem]">
            <div>
              <Select
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>
          {amount.length !== 0 && (
            <div className="flex items-center gap-[0.5rem] px-[0.5rem] py-[0.2rem] bg-[#cbf1de] dark:bg-[#2da966] font-semibold">
              <Typography
                variant="span"
                className="text-[#2da966] dark:text-[#fff] text-[0.8rem]"
              >
                Escrow Fee:
              </Typography>
              <Typography
                variant="span"
                className="text-[#2da966] dark:text-[#fff] text-[0.8rem]"
              >
                3$ applies
              </Typography>
            </div>
          )}
          <div className="w-full flex flex-col gap-[0.5rem]">
            <Typography variant="p" className="font-bold">
              Select payment
            </Typography>
            <div className="flex items-center gap-[1rem]">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => handlePaymentSelect(payment.name)}
                  className={clsx(
                    'text-sm capitalize bg-gray-100 dark:bg-gray-800 dark:text-white text-[#999999] rounded-md py-[0.5rem] px-[1rem] font-medium hover:opacity-[0.77] cursor-pointer',
                    selectedPayment === payment?.name &&
                      '!bg-gray-300 !text-[#272727] font-bold dark:!bg-gray-200 dark:!text-gray-800'
                  )}
                >
                  {payment.name}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full flex flex-col gap-[0.5rem]">
            <Typography variant="p" className="font-bold">
              Check Time (hrs)
            </Typography>
            <Input
              type="number"
              placeholder="Enter check time (hours) (e.g., 01, 12, 24)"
              value={checkTime}
              onChange={(e) => setcheckTime(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-[1rem] py-[0.5rem] ml-auto">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="bg-gray-100 !outline-0 text-[#999999] dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button variant="default">Create Escrow</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transact
