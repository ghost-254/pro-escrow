import React, { useState } from 'react'
import Typography from '../ui/typography'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { toggleAddFundsModal } from '@/lib/slices/addfunds.reducer'
import { X } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/select' // Import your custom Select components
import { RootState } from '@/lib/stores/store'

const AddFunds: React.FC = () => {
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('Crypto')
  const [details, setDetails] = useState<string>('')
  const [errors, setErrors] = useState<{ amount?: string; details?: string }>(
    {}
  )
  const { type } = useSelector((state: RootState) => state.addFunds)

  const dispatch = useDispatch()

  const handleCloseModal = () => {
    dispatch(toggleAddFundsModal())
  }

  const handleAddFunds = () => {
    const newErrors: { amount?: string; details?: string } = {}
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount.'
    }
    if (!details.trim()) {
      newErrors.details = `Please provide ${paymentMethod} details.`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    alert(`Adding ${amount} via ${paymentMethod} with details: ${details}`)
  }

  return (
    <div className="w-full h-full bg-transparent border flex flex-col items-center">
      <div className="w-full p-[0.5rem] lg:p-[1rem] rounded-lg shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <Typography
            variant="h1"
            className="text-center font-bold text-lg dark:text-white"
          >
            {type === 'withdraw' ? 'Withdraw Funds' : 'Add Funds'}
          </Typography>
          <Button onClick={handleCloseModal} title="Close" variant="hoverIcons">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="p" className="font-semibold">
            Amount
          </Typography>
          <Input
            type="number"
            placeholder="Enter amount (e.g., 100)"
            value={amount}
            min={5}
            onChange={(e) => {
              setAmount(e.target.value)
              setErrors({ ...errors, amount: '' })
            }}
          />
          {errors.amount && (
            <Typography variant="p" className="!text-red-500 text-sm">
              {errors.amount}
            </Typography>
          )}
        </div>

        {/* Payment Method Selection using Custom Select */}
        <div className="flex flex-col gap-[0.5rem]">
          <Typography variant="p" className="font-semibold">
            Payment Method
          </Typography>
          <Select
            onValueChange={(value) => {
              setPaymentMethod(value)
              setDetails('')
              setErrors({ ...errors, details: '' })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Crypto">
                Crypto (BEP20) - (0XTYEUERIOER)
              </SelectItem>
              <SelectItem value="PayPal">PayPal - (name@gmail.com)</SelectItem>
              <SelectItem value="Mpesa">Mpesa - (2547427838934)</SelectItem>
              <SelectItem value="Binance ID">
                Binance ID - (44789899)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Funds Button */}
        <Button
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary hover:opacity-[0.75]"
          onClick={handleAddFunds}
        >
          {type === 'withdraw' ? 'Withdraw' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export default AddFunds
