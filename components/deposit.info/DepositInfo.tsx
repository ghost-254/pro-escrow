'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Typography from '../ui/typography'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { FaMobileAlt } from 'react-icons/fa'
import { SiBinance } from 'react-icons/si'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import useTransaction from 'hooks/useTransaction'
import useWallet from 'hooks/useWallet'
import { toast } from 'react-toastify'
import { convertToUSD } from '@/lib/currencyConvert'
import { useRouter } from 'next/navigation'

type PaymentMethodDetails = {
  icon: React.ReactNode
  color: string
  value: string
}

const paymentMethodDetails: Record<'mpesa' | 'binance', PaymentMethodDetails> =
  {
    mpesa: {
      icon: <FaMobileAlt size={24} />,
      color: 'text-green-600',
      value: '07428452404', // Fixed Mpesa number
    },
    binance: {
      icon: <SiBinance size={24} />,
      color: 'text-yellow-500',
      value: '6347830933', // Fixed Binance ID
    },
  }

const DepositInfo: React.FC = () => {
  const depositDetails = useSelector((state: RootState) => state.depositInfo)
  const userDetail = useSelector((state: RootState) => state.auth.user)
  const userId: string = userDetail?.uid || ''
  const router = useRouter()

  const { wallet } = useWallet()
  const { processDepositTransaction, isTransacting, refreshUserTransactions } =
    useTransaction()
  const paymentMethodKey = depositDetails?.paymentMethod?.toLowerCase() as
    | 'mpesa'
    | 'binance'

  const details =
    paymentMethodDetails[paymentMethodKey] || paymentMethodDetails.mpesa

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(details.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy')
    }
  }

  const handleMarkAsPaid = async () => {
    const transactionDetails = {
      paymentMethod: depositDetails.paymentMethod || '',
      paymentDetails: details.value || '',
    }
    const transactionFee = 0
    const transactionStatus = 'Pending'
    const transactionType = 'Deposit'

    await processDepositTransaction(
      userId,
      convertToUSD(depositDetails?.amount, 128),
      transactionDetails,
      transactionFee,
      transactionStatus,
      transactionType
    )
    toast.success(
      `${depositDetails?.paymentMethod} deposit submitted - Wait time 5 minutes`
    )

    await refreshUserTransactions(userId)
    router.push('/wallet')
  }

  return (
    <div className="flex flex-col justify-center">
      <Card className="p-4 max-w-lg mx-auto space-y-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-lg p-2 hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft className="text-gray-700" size={24} />
            </button>
            <Typography variant="h1">Deposit Information</Typography>
            <div></div>
          </CardTitle>
        </CardHeader>
        <div>
          <Typography variant="h1">Wallet Balence</Typography>
          <Typography variant="h1">{wallet?.walletBalance}</Typography>
        </div>
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
            <Typography
              variant="h2"
              className="text-lg font-semibold capitalize"
            >
              {depositDetails?.paymentMethod + ' ' + 'Deposit'}
            </Typography>
          </div>

          <Typography
            variant="h2"
            className="text-lg font-semibold flex items-center gap-2"
          >
            Amount:{' '}
            <Typography
              variant="h1"
              className="text-green-600 font-bold text-[1.3rem]"
            >
              KSh{depositDetails?.amount}
            </Typography>
          </Typography>

          <div className="relative space-y-2">
            <Typography variant="h2" className="text-lg font-semibold">
              {paymentMethodKey === 'mpesa'
                ? 'Mpesa Number'
                : 'Binance Deposit (BinanceID)'}
              :
            </Typography>
            <input
              type="text"
              value={details.value}
              className="w-full p-2 border rounded-md bg-gray-100"
              readOnly
            />
            {paymentMethodKey === 'mpesa' && (
              <Typography variant="p" className="text-md font-semibold">
                1 USD = KSh128
              </Typography>
            )}
            <button
              onClick={handleCopy}
              className="absolute right-3 top-[45%] -translate-y-1/2"
            >
              {copied ? (
                <Check className="text-green-600 w-5 h-5" />
              ) : (
                <Copy className="text-gray-500 w-5 h-5" />
              )}
            </button>
          </div>

          <Typography variant="p" className="text-gray-600">
            Click <strong>Mark as Paid</strong> once you have completed the
            deposit.
          </Typography>

          <Button
            disabled={isTransacting}
            className="w-full"
            onClick={handleMarkAsPaid}
          >
            {isTransacting ? 'Please wait... ' : 'Mark as Paid'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default DepositInfo
