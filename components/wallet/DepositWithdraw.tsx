/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'
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
import Typography from '../ui/typography'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import useAuth from 'hooks/useAuth'
import useTransaction from 'hooks/useTransaction'
import useWallet from 'hooks/useWallet'
import { useToast } from 'hooks/use-toast'

function DepositAndWithdraw({
  isDeposit,
  isWithdraw,
}: {
  isDeposit: boolean
  isWithdraw: boolean
  setIsdeposit: (value: boolean) => void
  setIswithdraw: (value: boolean) => void
}) {
  const { fetchUserById } = useAuth()
  const { toast } = useToast()
  const { refreshWallet, wallet } = useWallet()
  const { depositTransaction, withdrawTransaction, isTransacting } =
    useTransaction()

  const [shakeHeader, setShakeHeader] = useState(false)
  const [amount, setAmount] = useState<any>('')
  const [selectedMethod, setSelectedMethod] = useState<{
    value: string
    detail: string
  } | null>(null)

  const [errors, setErrors] = useState({ amount: '', method: '' })
  const [user, setUser] = useState<any | null>(null)
  const userDetail = useSelector((state: RootState) => state.auth.user)
  const userId: string | undefined = userDetail?.uid // Handle possible undefined value
  console.log(userId)

  useEffect(() => {
    if (!userId) {
      return
    }

    const getUser = async () => {
      try {
        const fetchedUser = await fetchUserById(userId)
        setUser(fetchedUser)
      } catch (error) {
        console.error('Error fetching user by ID:', error)
      }
    }

    getUser()
  }, [userId])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parsedValue = parseFloat(value) // Converts the string to a float
    if (!isNaN(parsedValue)) {
      setAmount(parsedValue) // Only set if it's a valid number
    } else {
      console.log('Invalid number input')
    }
  }

  const options = isDeposit
    ? [
        {
          label: 'Cryptocurrency',
          value: 'cryptocurrency',
          detail: '90430943u3r489grhrehg934h3049g94340',
        },
        {
          label: 'Mpesa',
          value: 'mpesa',
          detail: '0742845204 - Kennedy Wandia',
        },
      ]
    : [
        {
          label: `Mpesa (${user?.mpesa || 'N/A'})`,
          value: 'mpesa',
          detail: user?.mpesa || 'N/A',
        },
        {
          label: `PayPal (${user?.paypal || 'N/A'})`,
          value: 'paypal',
          detail: user?.paypal || 'N/A',
        },
        {
          label: `BEP20 (${user?.cryptoBEP20 || 'N/A'})`,
          value: 'bep20',
          detail: user?.cryptoBEP20 || 'N/A',
        },
      ]

  const actionText = isDeposit ? 'Deposit Funds' : 'Withdraw Funds'
  const headerText = isDeposit ? 'Deposit Funds' : 'Withdraw Funds'

  // Trigger shake animation whenever the state changes
  useEffect(() => {
    setShakeHeader(true)
    const timer = setTimeout(() => setShakeHeader(false), 1000) // Animation duration: 1 second
    return () => clearTimeout(timer)
  }, [isDeposit, isWithdraw])

  const validateFields = () => {
    let isValid = true
    const newErrors = { amount: '', method: '' }

    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount.'
      isValid = false
    }

    // Validate method
    if (!selectedMethod) {
      newErrors.method = 'Please select a method.'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (validateFields()) {
      if (!userId) {
        return // Prevent further execution if userId is undefined
      }

      const transactionDetails = {
        paymentMethod: selectedMethod?.value || '',
        paymentDetails: selectedMethod?.detail || '',
      }
      console.log(isDeposit)

      if (isDeposit) {
        await depositTransaction(userId, amount, transactionDetails)
        toast({
          description: 'Wallet updated successfully.',
          variant: 'default',
        })
        await refreshWallet(userId)
      } else {
        if (
          wallet &&
          wallet.walletBalance !== undefined &&
          amount > wallet.walletBalance
        ) {
          alert('Insufficient balance')
          toast({
            description: 'Insufficient balance',
            variant: 'default',
          })
          return
        }
        await withdrawTransaction(userId, amount, transactionDetails)
        alert('Wallet updated successfully.')

        toast({
          description: 'Wallet updated successfully.',
          variant: 'default',
        })
        await refreshWallet(userId)
      }
    }
  }

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
            <Input
              id="amount"
              placeholder="Enter amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
            />
            {errors.amount && (
              <Typography variant="span" className="text-sm text-red-500">
                {errors.amount}
              </Typography>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">
              {isDeposit ? 'Deposit Method' : 'Withdraw Method'}
            </Label>
            <Select
              onValueChange={(value) => {
                const selectedOption = options?.find(
                  (option) => option?.value === value
                )
                if (selectedOption) {
                  setSelectedMethod(selectedOption)
                }
              }}
            >
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.method && (
              <Typography variant="span" className="text-sm text-red-500">
                {errors?.method}
              </Typography>
            )}
          </div>
          {/* <Link href={'/deposit-info'}> */}
          <Button
            disabled={isTransacting}
            className="w-full"
            onClick={handleSubmit}
          >
            {isDeposit ? (
              <DollarSign className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {!isTransacting ? actionText : 'Please wait...'}
          </Button>
          {/* </Link> */}
        </CardContent>
      </Card>
    </div>
  )
}

export default DepositAndWithdraw
