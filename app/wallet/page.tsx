/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

import Typography from '@/components/ui/typography'
import Analytics from '@/components/wallet/Analytics'
import Transactions from '@/components/wallet/Transactions'
import DepositAndWithdraw from '@/components/wallet/DepositWithdraw'
import HeaderBal from '@/components/wallet/HeaderBal'
import useWallet from '../../hooks/useWallet'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'

export default function WalletPage() {
  const [isDeposit, setIsdeposit] = useState(false)
  const [isWithdraw, setIsWithdraw] = useState(false)
  const [isRefetch, setIsRefetch] = useState(false)
  const { wallet, fetchUserWalletById, refreshWallet } = useWallet()
  const user = useSelector((state: RootState) => state?.auth.user)
  const userId = user?.uid
  // Check if the wallet or userId is null or undefined before attempting to fetch
  useEffect(() => {
    if (userId) {
      fetchUserWalletById(userId)
    }
  }, [userId])

  const handleRefetch = async () => {
    if (userId) {
      setIsRefetch(true)
      await refreshWallet(userId)
      setTimeout(() => {
        setIsRefetch(false)
      }, 1000)
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="w-full mx-auto py-[1rem] px-[1rem] space-y-[1rem]">
        <Typography
          variant="h1"
          className="text-[1.3rem] font-bold dark:!text-white"
        >
          My Wallet
        </Typography>

        <div className=" w-full flex flex-col gap-[1rem]">
          <div className="flex flex-col md:flex-row w-full gap-[1rem]">
            <div className="w-full md:w-[60%]">
              <HeaderBal
                currency={wallet?.currency || 'USD'}
                balance={wallet?.walletBalance || 0.0}
                frozenBalance={wallet?.frozenBalance || 0.0}
                isDeposit={isDeposit}
                isRefresh={isRefetch}
                isWithdraw={isWithdraw}
                setIsdeposit={setIsdeposit}
                setIsWithdraw={setIsWithdraw}
                handleRefetch={handleRefetch}
              />
            </div>
            <div className="w-full md:w-[40%]">
              <DepositAndWithdraw
                isDeposit={isDeposit}
                isWithdraw={isWithdraw}
                setIsdeposit={setIsdeposit}
                setIswithdraw={setIsWithdraw}
              />
            </div>
          </div>

          <Analytics />

          <Transactions />
        </div>
      </div>
    </ScrollArea>
  )
}
