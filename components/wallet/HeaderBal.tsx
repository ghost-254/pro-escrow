/* eslint-disable no-unused-vars */
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'

function HeaderBal({
  balance,
  frozenBalance,
  isDeposit,
  isWithdraw,
  setIsdeposit,
  setIsWithdraw,
  handleRefetch,
  currency,
  isRefresh,
}: {
  balance: number
  frozenBalance: number
  currency: string
  isDeposit: boolean
  isRefresh: boolean
  isWithdraw: boolean
  setIsdeposit: (value: boolean) => void
  handleRefetch: (value: null) => void
  setIsWithdraw: (value: boolean) => void
}) {
  const handleDeposit = () => {
    setIsWithdraw(false)
    setIsdeposit(true)
  }

  const handleWithdraw = () => {
    setIsdeposit(false)
    setIsWithdraw(true)
  }

  return (
    <div>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center text-md md:text-xl">
            <Wallet className="mr-2 h-5 w-5" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-[1rem]">
            <div className="flex flex-col gap-[0.5rem]">
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {isRefresh
                    ? currency + ' ' + '0.00' // Show 0 if refreshing
                    : currency +
                      new Intl.NumberFormat('en-US', {
                        style: 'decimal', // Use 'decimal' instead of 'currency'
                      }).format(balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frozen Balance</p>
                <p className="text-xl md:text-2xl font-bold">
                  {isRefresh
                    ? currency + ' ' + '0.00' // Show 0 if refreshing
                    : currency +
                      new Intl.NumberFormat('en-US', {
                        style: 'decimal', // Use 'decimal' instead of 'currency'
                      }).format(frozenBalance)}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col md:flex-row md:w-auto gap-[0.5rem] md:gap-2">
              <Button
                onClick={() => handleRefetch(null)}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${
                  isDeposit
                    ? 'bg-primary text-white hover:opacity-[0.77] hover:bg-primary hover:text-white'
                    : ''
                }`}
                onClick={handleDeposit}
              >
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button
                variant="outline"
                className={`${
                  isWithdraw
                    ? 'bg-primary text-white hover:opacity-[0.77] hover:bg-primary hover:text-white'
                    : ''
                }`}
                size="sm"
                onClick={handleWithdraw}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HeaderBal
