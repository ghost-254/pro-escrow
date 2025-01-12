import React, { useState } from 'react'
import Typography from '../ui/typography'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

const AddFunds: React.FC = () => {
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('Crypto')
  const [details, setDetails] = useState<string>('')
  const [errors, setErrors] = useState<{ amount?: string; details?: string }>(
    {}
  )

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
    <div className="w-full h-full bg-transparent flex flex-col items-center">
      <div className="w-full bg-white p-6 rounded-lg shadow-md space-y-6">
        <Typography variant="h1" className="text-center font-bold text-lg">
          Add Funds
        </Typography>

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <Typography variant="span" className="font-semibold">
            Amount
          </Typography>
          <Input
            type="number"
            placeholder="Enter amount (e.g., 100.00)"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setErrors({ ...errors, amount: '' })
            }}
          />
          {errors.amount && (
            <Typography variant="span" className="text-red-500 text-sm">
              {errors.amount}
            </Typography>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="flex flex-col gap-2">
          <Typography variant="span" className="font-semibold">
            Payment Method
          </Typography>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value)
              setDetails('')
              setErrors({ ...errors, details: '' })
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="Crypto">Crypto (BEP20)</option>
            <option value="PayPal">PayPal</option>
            <option value="Mpesa">Mpesa</option>
            <option value="Binance ID">Binance ID</option>
          </select>
        </div>

        {/* Add Funds Button */}
        <Button
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500"
          onClick={handleAddFunds}
        >
          Add Funds
        </Button>
      </div>
    </div>
  )
}

export default AddFunds
