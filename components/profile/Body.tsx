'use client'

import React, { useState } from 'react'
import Typography from '../ui/typography'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

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
    phoneNumber: '+1234567890',
    cryptoBEP20: '0xABCDEF1234567890',
    binanceId: '12345678',
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
    <div className="space-y-6 px-[1rem] my-[0.5rem] mb-[15rem]">
      <div className="flex flex-col gap-[0.5rem]">
        <Typography variant="h2" className="font-semibold">
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
            <Typography variant="span" className="text-red-500 text-sm">
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
          />
          {errors.email && (
            <Typography variant="span" className="text-red-500 text-sm">
              {errors.email}
            </Typography>
          )}
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="span" className="font-semibold">
            Phone Number
          </Typography>
          <Input
            type="tel"
            placeholder="Enter your phone number"
            value={formState.phoneNumber}
            onChange={handleChange('phoneNumber')}
            className="w-full"
          />
          {errors.phoneNumber && (
            <Typography variant="span" className="text-red-500 text-sm">
              {errors.phoneNumber}
            </Typography>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex flex-col gap-[0.5rem]">
        <Typography variant="h2" className="font-semibold">
          Payment Methods
        </Typography>

        {['cryptoBEP20', 'binanceId', 'paypal', 'mpesa'].map((field) => (
          <div key={field} className="flex flex-col gap-[0.5rem]">
            <Typography variant="span" className="font-semibold capitalize">
              {field.replace(/([A-Z])/g, ' $1')} {/* Format camelCase */}
            </Typography>
            <Input
              type="text"
              placeholder={`Enter ${field}`}
              value={formState[field as keyof FormState]}
              onChange={handleChange(field as keyof FormState)}
              className="w-full"
            />
            {errors[field as keyof FormState] && (
              <Typography variant="span" className="text-red-500 text-sm">
                {errors[field as keyof FormState]}
              </Typography>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div>
        <Button
          onClick={handleSave}
          className="bg-blue-500 text-white font-semibold px-6 py-2 rounded"
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default Body
