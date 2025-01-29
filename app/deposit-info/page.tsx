'use client'
/* eslint-disable no-console */
import DepositInfo from '@/components/deposit.info/DepositInfo'

function Page() {
  const amount = ''
  const phoneNumber = ''
  const paymentMethod = 'Mpesa'
  const paymentDetails = ''

  const handleMarkAsPaid = () => {
    console.log('Payment marked as paid!')
    // Additional logic can go here
  }

  return (
    <div>
      <DepositInfo
        amount={amount as string}
        phoneNumber={phoneNumber as string}
        paymentMethod={paymentMethod as 'Mpesa' | 'PayPal' | 'Crypto'}
        paymentDetails={paymentDetails as string}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  )
}

export default Page
