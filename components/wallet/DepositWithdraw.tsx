/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import 'animate.css'

function DepositAndWithdraw({
  isDeposit,
  isWithdraw,
}: {
  isDeposit: boolean
  isWithdraw: boolean
  setIsdeposit: (value: boolean) => void
  setIswithdraw: (value: boolean) => void
}) {
  const [shakeHeader, setShakeHeader] = useState(false)

  const options = isDeposit
    ? ['Mpesa Paybill', 'Cryptocurrency', 'PayPal', 'AirTM']
    : ['Bank Transfer', 'Cryptocurrency', 'PayPal', 'AirTM']

  const actionText = isDeposit ? 'Deposit Funds' : 'Withdraw Funds'
  const headerText = isDeposit ? 'Deposit Funds' : 'Withdraw Funds'

  // Trigger shake animation whenever the state changes
  useEffect(() => {
    setShakeHeader(true)
    const timer = setTimeout(() => setShakeHeader(false), 1000) // Animation duration: 1 second
    return () => clearTimeout(timer)
  }, [isDeposit, isWithdraw])

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle
            className={`text-lg md:text-xl ${
              shakeHeader ? 'animate__animated animate__shakeX' : ''
            } ${isDeposit || isWithdraw ? 'text-primary' : ''}`}
          >
            {headerText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-[1rem]">
          <div className="space-y-[0.5rem]">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" placeholder="Enter amount" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">
              {isDeposit ? 'Deposit Method' : 'Withdraw Method'}
            </Label>
            <Select>
              <SelectTrigger id="method">
                <SelectValue
                  placeholder={`Select ${isDeposit ? 'deposit' : 'withdraw'} method`}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option.toLowerCase()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full ">
            {isDeposit ? (
              <DollarSign className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {actionText}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default DepositAndWithdraw
