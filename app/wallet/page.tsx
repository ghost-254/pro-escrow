// app/wallet/page.tsx

'use client'

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

import Typography from '@/components/ui/typography'
import Analytics from '@/components/wallet/Analytics'
import Transactions from '@/components/wallet/Transactions'
import DepositAndWithdraw from '@/components/wallet/DepositWithdraw'
import HeaderBal from '@/components/wallet/HeaderBal'

export default function WalletPage() {
  const [balance] = useState(10000.5)
  const [frozenBalance] = useState(100.5)

  const [isDeposit, setIsdeposit] = useState(false)
  const [isWithdraw, setIsWithdraw] = useState(false)

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
                balance={balance}
                frozenBalance={frozenBalance}
                isDeposit={isDeposit}
                isWithdraw={isWithdraw}
                setIsdeposit={setIsdeposit}
                setIsWithdraw={setIsWithdraw}
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
