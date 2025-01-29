'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Typography from '../ui/typography'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { FaMobileAlt } from 'react-icons/fa'
import { SiPaypal, SiBinance } from 'react-icons/si'
import Image from 'next/image'

type PaymentMethodDetails = {
  icon: React.ReactNode
  link: string
  color: string
  newAccountLink: string
}

type DepositInfoProps = {
  amount: string
  phoneNumber?: string
  paymentMethod: 'Mpesa' | 'PayPal' | 'Crypto'
  paymentDetails?: string
  onMarkAsPaid: () => void
}

const paymentMethodDetails: Record<
  'mpesa' | 'paypal' | 'cryptocurrency',
  PaymentMethodDetails
> = {
  mpesa: {
    icon: <FaMobileAlt size={24} />,
    color: 'text-green-600',
    link: 'https://www.mpesa.com',
    newAccountLink: 'https://www.mpesa.com/register',
  },
  paypal: {
    icon: <SiPaypal size={24} />,
    color: 'text-blue-600',
    link: 'https://www.paypal.com',
    newAccountLink: 'https://www.paypal.com/signup',
  },
  cryptocurrency: {
    icon: <SiBinance size={24} />,
    color: 'text-yellow-500',
    link: 'https://www.crypto.com',
    newAccountLink: 'https://www.crypto.com/signup',
  },
}

const DepositInfo: React.FC<DepositInfoProps> = ({
  paymentMethod,
  paymentDetails,
  onMarkAsPaid,
}) => {
  // Access transaction data from Redux store
  const transactionDetails = useSelector(
    (state: RootState) => state?.transaction
  )
  const [inputValue, setInputValue] = useState(
    transactionDetails?.paymentDetails || ''
  )
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inputValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy')
    }
  }

  useEffect(() => {
    if (paymentDetails) {
      setInputValue(paymentDetails)
    }
  }, [paymentDetails])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const paymentMethodKey = paymentMethod.toLowerCase() as
    | 'mpesa'
    | 'paypal'
    | 'cryptocurrency'
  const details = paymentMethodDetails[paymentMethodKey]

  return (
    <div className="flex flex-col justify-center">
      <Card className="p-[1rem] max-w-lg mx-auto space-y-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-lg p-2 hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft className="text-gray-700" size={24} />
            </button>
            <Typography variant="h1">Deposit Information</Typography>
            <p></p>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div
              className={`p-2 rounded-full ${details.color}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {details.icon}
            </div>
            <Typography variant="h2" className="text-lg font-semibold">
              {transactionDetails?.paymentMethod}
            </Typography>
          </div>

          <Typography variant="h2" className="text-lg font-semibold">
            Amount:{' '}
            <span className="text-green-600">{transactionDetails?.amount}</span>
          </Typography>
          {transactionDetails?.paymentMethod === 'cryptocurrency' && (
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9DZrSfz5PwNlbitC7dO_TjoozHBtVzcnjYg&s"
              alt="QR Code"
              width={80}
              height={80}
            />
          )}

          <div className="relative space-y-2">
            <Typography variant="h2" className="text-lg font-semibold">
              {transactionDetails?.paymentMethod === 'PayPal'
                ? 'PayPal Email'
                : 'Crypto Wallet Address'}
              :
            </Typography>
            <input
              type="text"
              value={
                inputValue.length > 15
                  ? `${inputValue.slice(0, 25)}...`
                  : inputValue
              }
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder={
                transactionDetails?.paymentMethod === 'PayPal'
                  ? 'Enter PayPal email'
                  : 'Enter crypto wallet address'
              }
              title={inputValue} // Show full value on hover
            />

            <button
              onClick={handleCopy}
              className="absolute right-3 top-[63%] -translate-y-1/2"
            >
              {copied ? (
                <Check className="text-green-600 w-5 h-5" />
              ) : (
                <Copy className="text-gray-500 w-5 h-5" />
              )}
            </button>
          </div>

          <Typography variant="p" className="text-gray-600">
            Click <strong>Mark as Paid</strong> to confirm your payment.
          </Typography>

          <Button className="w-full" onClick={onMarkAsPaid}>
            Mark as Paid
          </Button>

          {transactionDetails?.paymentMethod !== 'Mpesa' && (
            <Typography
              variant="p"
              className="text-blue-500 underline text-center"
            >
              <a
                href={details.newAccountLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Create a new {transactionDetails?.paymentMethod} account
              </a>
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DepositInfo
