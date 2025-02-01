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
import { Button } from '@/components/ui/button'
import 'animate.css'
import Typography from '../ui/typography'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import useAuth from 'hooks/useAuth'
import useTransaction from 'hooks/useTransaction'
import useWallet from 'hooks/useWallet'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { setTransactionData } from '@/lib/slices/deposit.info.reducer'

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
  const router = useRouter()
  const { refreshUserWallet, wallet } = useWallet()
  const {
    processDepositTransaction,
    processWithdrawalTransaction,
    isTransacting,
    refreshUserTransactions,
  } = useTransaction()

  const [shakeHeader, setShakeHeader] = useState(false)
  const [amount, setAmount] = useState<any>('')
  const [selectedMethod, setSelectedMethod] = useState<{
    value: string
    detail: string
  } | null>(null)

  const [errors, setErrors] = useState({ amount: '', method: '' })
  const [user, setUser] = useState<any | null>(null)
  const userDetail = useSelector((state: RootState) => state.auth.user)
  const userId: string | undefined = userDetail?.uid 

  useEffect(() => {
    if (!userId) {
      return
    }

    const getUser = async () => {
      try {
        const fetchedUser = await fetchUserById(userId)
        setUser(fetchedUser)
      } catch (error) {
        toast.error('Error fetching user by ID' + error)
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
      toast.error('Invalid number input')
    }
  }

  const handleValueChange = (value: string | null) => {
    const selectedOption = options?.find((option) => option?.value === value)

    if (selectedOption) {
      // Check if the label contains "N/A"
      if (selectedOption.label.includes('N/A')) {
        router.push('/profile') // Navigate to /profile if the label contains "N/A"
      } else {
        setSelectedMethod(selectedOption) // Set the selected method
      }
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
        {
          label: 'Binance ID',
          value: 'binanceid',
          detail: '3767343445',
        },
      ]
    : [
        {
          label: `Mpesa (${user?.mpesa || 'N/A'})`,
          value: 'mpesa',
          detail: user?.mpesa || 'N/A',
        },
        {
          label: `Binance ID (${user?.binanceDd || 'N/A'})`,
          value: 'paypal',
          detail: user?.binanceId || 'N/A',
        },
        {
          label: `Cryptocurrency (${user?.cryptoBEP20 || 'N/A'})`,
          value: 'cryptocurrency',
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

  const dispatch = useDispatch()

  const handleNextOrSubmit = () => {
    // Check if the selected method is either Mpesa or Binance ID.
    if (
      selectedMethod?.value === 'mpesa' ||
      selectedMethod?.value === 'binanceid'
    ) {
      // Dispatch the transaction data before navigating.
      dispatch(
        setTransactionData({
          amount, // amount should come from your component state (or wherever you store it)
          paymentMethod: selectedMethod.value,
        })
      )
      router.push('/deposit-info') // Navigate to deposit info page.
    } else {
      handleSubmit() // Proceed with the normal deposit/withdrawal process.
    }
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
      const transactionFee = 0
      const transactionStatus = 'Pending'
      const transactionType = 'Deposit'

      if (isDeposit) {
        await processDepositTransaction(
          userId, amount, transactionDetails,transactionFee,transactionStatus,transactionType
        )
        toast.success('Deposit submitted')
        await refreshUserWallet(userId)
        await refreshUserTransactions(userId)
      } else {
        if (
          wallet &&
          wallet.walletBalance !== undefined &&
          amount > wallet.walletBalance
        ) {
          toast.error('Insufficient balance')

          return
        }
        await processWithdrawalTransaction(userId, amount, transactionDetails)
        await refreshUserTransactions(userId)

        toast.success('Withdrawal submitted')

        await refreshUserWallet(userId)
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
            <Select onValueChange={handleValueChange}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.detail === 'N/A' ? (
                      <span style={{ cursor: 'pointer' }}>
                        {option.label} (click to update)
                      </span>
                    ) : (
                      option.label
                    )}
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
          <Button
            disabled={isTransacting}
            className="w-full"
            onClick={handleNextOrSubmit}
          >
            {selectedMethod?.value === 'mpesa' ||
            selectedMethod?.value === 'binanceid'
              ? 'Next'
              : !isTransacting
                ? actionText
                : 'Please wait...'}
          </Button>
          {/* <Link href={'/deposit-info'}> */}
          {/* <Button
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
          </Button> */}
          {/* </Link> */}
        </CardContent>
      </Card>
    </div>
  )
}

export default DepositAndWithdraw
