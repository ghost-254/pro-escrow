'use client'

import React, { useState } from 'react'
import Typography from '../ui/typography'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Copy } from 'lucide-react'

interface FormState {
  fullName: string
  email: string
  phoneNumber: string
  cryptoBEP20: string
  binanceId: string
  paypal: string
  mpesa: string
}

const Body: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phoneNumber: '254712345678',
    cryptoBEP20: '0xABCDEF1234567890',
    binanceId: '254712345678',
    paypal: 'john.doe@paypal.com',
    mpesa: '254700123456',
  })

  const [errors, setErrors] = useState<Partial<FormState>>({})

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState({ ...formState, [field]: e.target.value })
      setErrors({ ...errors, [field]: '' }) // Clear errors on input change
    }

  const handleSave = () => {
    // Validate inputs
    const newErrors: Partial<FormState> = {}
    Object.keys(formState).forEach((key) => {
      const field = key as keyof FormState
      if (!formState[field].trim()) {
        newErrors[field] = `${field} cannot be empty`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    alert('Changes have been saved!')
  }

  return (
    <div className="space-y-6 lg:px-[1rem] px-[0.5rem] my-[0.5rem] mb-[20rem] md:mb-[15rem]">
      <div className="flex flex-col lg:gap-[1rem] gap-[0.5rem]">
        <Typography variant="h2" className="dark:text-white font-medium">
          User Details
        </Typography>
        {/* Full Name */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Full Name
          </Typography>
          <Input
            type="text"
            placeholder="Enter your full name"
            value={formState.fullName}
            onChange={handleChange('fullName')}
            className="w-full"
          />
          {errors.fullName && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.fullName}
            </Typography>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Email Address
          </Typography>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={formState.email}
            onChange={handleChange('email')}
            className="w-full"
            readOnly
          />
          {errors.email && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.email}
            </Typography>
          )}
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Phone Number
          </Typography>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-500">+</span>
            <Input
              type="tel"
              placeholder=" 254712345678 (e.g., Kenya)"
              value={
                formState.phoneNumber.startsWith('+')
                  ? formState.phoneNumber.slice(1)
                  : formState.phoneNumber
              }
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '') // Only allow numeric input
                setFormState({ ...formState, phoneNumber: `+${value}` })
                setErrors({ ...errors, phoneNumber: '' }) // Clear error
              }}
              className="w-full pl-8" // Adjust padding to accommodate the "+" prefix
            />
          </div>
          {errors.phoneNumber && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.phoneNumber}
            </Typography>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex flex-col lg:gap-[1rem] gap-[0.5rem]">
        <Typography variant="h2" className="dark:text-white font-medium">
          Payment Methods
        </Typography>

        {/* Crypto BEP20 */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Crypto (BEP20)
          </Typography>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter Crypto BEP20 address"
              value={formState.cryptoBEP20}
              onChange={handleChange('cryptoBEP20')}
              className="w-full"
            />
            <Copy className="w-3.5 h-3.5 cursor-pointer hover:opacity-[0.77] absolute top-[0.7rem] right-[0.7rem] dark:text-[gray]" />
          </div>
          {errors.cryptoBEP20 && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.cryptoBEP20}
            </Typography>
          )}
        </div>

        {/* Binance ID */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Binance ID
          </Typography>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter Binance ID"
              value={formState.binanceId}
              onChange={handleChange('binanceId')}
              className="w-full"
            />
            <Copy className="w-3.5 h-3.5 cursor-pointer hover:opacity-[0.77] dark:hover:text-white absolute top-[0.7rem] right-[0.7rem] dark:text-[gray]" />
          </div>
          {errors.binanceId && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.binanceId}
            </Typography>
          )}
        </div>

        {/* PayPal */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            PayPal
          </Typography>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter PayPal address"
              value={formState.paypal}
              onChange={handleChange('paypal')}
              className="w-full"
            />
            <Copy className="w-3.5 h-3.5 cursor-pointer hover:opacity-[0.77] absolute top-[0.7rem] right-[0.7rem] dark:text-[gray]" />
          </div>
          {errors.paypal && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.paypal}
            </Typography>
          )}
        </div>

        {/* Mpesa */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Mpesa
          </Typography>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter Mpesa number"
              value={formState.mpesa}
              onChange={handleChange('mpesa')}
              className="w-full"
            />
            <Copy className="w-3.5 h-3.5 cursor-pointer hover:opacity-[0.77] absolute top-[0.7rem] right-[0.7rem] dark:text-[gray]" />
          </div>
          {errors.mpesa && (
            <Typography
              variant="span"
              className="!text-red-500 capitalize text-sm"
            >
              {errors.mpesa}
            </Typography>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-end md:gap-[1rem] gap-[0.5rem]">
        <Button onClick={handleSave} variant={'hoverIcons'}>
          Back
        </Button>
        <Button
          className="bg-primary hover:opacity-[0.75] hover:bg-primary text-white"
          onClick={handleSave}
          variant={'ghost'}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default Body
