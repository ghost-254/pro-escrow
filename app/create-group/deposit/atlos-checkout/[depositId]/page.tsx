'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/firebaseConfig'

import { loadAtlosScript, atlosPay } from '@/lib/atlos'
import useTransaction from 'hooks/useTransaction'

// Define the deposit structure.
interface Deposit {
  id: string
  escrowFeeResponsibility: 'seller' | '50/50' | 'buyer'
  price: number
  escrowFee: number
  userId: string
  transactionType: string
  groupId?: string
  depositMethod: string

  // Other fields can be added if necessary.
}

// Calculate final deposit amount based on fee responsibility.
function calcDepositAmount(deposit: Deposit): number {
  const { escrowFeeResponsibility, price, escrowFee } = deposit
  switch (escrowFeeResponsibility) {
    case 'seller':
      return price
    case '50/50':
      return price + escrowFee / 2
    case 'buyer':
    default:
      return price + escrowFee
  }
}

export default function AtlosCheckoutPage() {
  const router = useRouter()
  const { depositId } = useParams() as { depositId: string }
  const { processDepositTransaction } = useTransaction()
  const [depositData, setDepositData] = useState<Deposit | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1) Fetch deposit document.
    const fetchDeposit = async () => {
      if (!depositId) {
        toast.error('Invalid deposit ID.')
        router.push('/')
        return
      }
      try {
        const ref = doc(db, 'deposits', depositId)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          toast.error('Deposit not found.')
          router.push('/')
          return
        }
        // Type assertion: we expect the data to match the Deposit interface.
        setDepositData({ id: snap.id, ...(snap.data() as Omit<Deposit, 'id'>) })
      } catch {
        toast.error('Error fetching deposit.')
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    // 2) Load Atlos script.
    loadAtlosScript()

    fetchDeposit()
  }, [depositId, router])

  // Create group document, send notification, and redirect.
  async function createGroupAndRedirect(
    depositDoc: Deposit,
    newStatus: string
  ): Promise<void> {
    const depositRef = doc(db, 'deposits', depositDoc.id)

    // 1) Update deposit status.
    await updateDoc(depositRef, {
      status: newStatus,
    })

    // 2) Create group document.
    const groupData = {
      depositId: depositDoc.id,
      participants: [depositDoc.userId], // buyer
      status: newStatus, // "paid", "canceled", or "failed"
      createdAt: Timestamp.now(),
      transactionDetails: {
        price: depositDoc.price,
        escrowFee: depositDoc.escrowFee,
        transactionType: depositDoc.transactionType,
      },
    }
    const groupRef = await addDoc(collection(db, 'groups'), groupData)
    const groupId = groupRef.id

    // 3) Link deposit document with groupId.
    await updateDoc(depositRef, { groupId })

    // 4) Post a notification.
    const shortGroupName = `Xcrow_${groupId.slice(0, 4)}`
    await addDoc(collection(db, 'notifications'), {
      userId: depositDoc.userId,
      message: `You created a new ${shortGroupName} group. Please share this link with the seller.`,
      link: `/group-chat/${groupId}`,
      read: false,
      createdAt: Timestamp.now(),
    })

    // 5) Redirect to the group chat.
    router.push(`/group-chat/${groupId}`)
  }

  async function handlePayment() {
    if (!depositData) {
      toast.error('No deposit data loaded.')
      return
    }
    setIsLoading(true)

    const finalAmount = calcDepositAmount(depositData)

    // Define Atlos options explicitly before passing to atlosPay
    const options = {
      merchantId: process.env.NEXT_PUBLIC_ATLOS_MERCHANT_ID || '', // Ensure it's set
      orderId: depositData.id,
      orderAmount: finalAmount,
      orderCurrency: 'USD',
      theme: 'dark',

      onSuccess: async () => {
        toast.success('Payment success!')
        await createGroupAndRedirect(depositData, 'paid')

        const transactionDetails = {
          paymentMethod: depositData?.depositMethod || '',
          paymentDetails: '',
        }
        const transactionStatus = 'Completed'
        await processDepositTransaction(
          depositData?.userId,
          depositData?.price,
          transactionDetails,
          depositData?.escrowFee,
          transactionStatus,
          depositData.transactionType
        )
        setIsLoading(false)
      },
      onCanceled: async () => {
        toast.info('Payment canceled.')
        await createGroupAndRedirect(depositData, 'canceled')
        const transactionDetails = {
          paymentMethod: depositData?.depositMethod || '',
          paymentDetails: '',
        }
        const transactionStatus = 'Canceled'
        await processDepositTransaction(
          depositData?.userId,
          depositData?.price,
          transactionDetails,
          depositData?.escrowFee,
          transactionStatus,
          depositData.transactionType
        )
        setIsLoading(false)
      },
      onFailed: async () => {
        toast.error('Payment failed.')
        await createGroupAndRedirect(depositData, 'failed')
        const transactionStatus = 'Failed'
        const transactionDetails = {
          paymentMethod: depositData?.depositMethod || '',
          paymentDetails: '',
        }
        await processDepositTransaction(
          depositData?.userId,
          depositData?.price,
          transactionDetails,
          depositData?.escrowFee,
          transactionStatus,
          depositData.transactionType
        )
        setIsLoading(false)
      },
    }

    await atlosPay(options)
  }

  if (isLoading) {
    return <div className="p-4">Loading deposit info...</div>
  }
  if (!depositData) {
    return <div className="p-4">No deposit data found.</div>
  }

  const finalAmount = calcDepositAmount(depositData)

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Pay with Crypto (Atlos)</h1>
      <p className="mb-2">Deposit ID: {depositData.id}</p>
      <p className="mb-2">Amount to Pay: ${finalAmount.toFixed(2)}</p>

      <Button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Pay with Atlos'}
      </Button>
    </div>
  )
}
