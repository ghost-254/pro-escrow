/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search } from 'lucide-react'
import useTransaction from 'hooks/useTransaction'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { Timestamp } from 'firebase/firestore'
import useWallet from 'hooks/useWallet'
import Typography from '../ui/typography'
import { FaMobileAlt, FaMoneyBillWave } from 'react-icons/fa'
import { SiPaypal, SiBinance } from 'react-icons/si'

function Transactions() {
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState<string>('All')

  // Get user detail from Redux store
  const userDetail = useSelector((state: RootState) => state.auth.user)
  const userId: string | undefined = userDetail?.uid // Handle possible undefined value

  // Transaction fetching hook
  const { transactions, getUserTransactionsByFilter } = useTransaction()
  const { wallet } = useWallet()

  // Fetch transactions when userId or filters change
  useEffect(() => {
    if (userId) {
      getUserTransactionsByFilter(
        searchTerm,
        userId,
        transactionTypeFilter,
        statusFilter
      )
    }
  }, [userId, searchTerm, transactionTypeFilter, statusFilter])

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions?.slice(0, 10)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'Canceled':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Helper function to determine the icon based on payment method
  const getPaymentIcon = (method: string) => {
    const lowerMethod = method.toLowerCase().trim()

    if (lowerMethod.includes('mpesa')) {
      return <FaMobileAlt size={24} className="text-green-500" title="Mpesa" />
    } else if (lowerMethod.includes('paypal')) {
      return <SiPaypal size={24} className="text-blue-500" title="PayPal" />
    } else if (lowerMethod.includes('binanceid')) {
      // If you want to display the Binance icon for Binance transactions.
      return <SiBinance size={24} className="text-yellow-500" title="Binance" />
    } else if (
      lowerMethod.includes('crypto') ||
      lowerMethod.includes('atlos') ||
      lowerMethod.includes('crypto (atlos)')
    ) {
      // For crypto transactions, display a wallet (or crypto) icon.
      return (
        <FaMoneyBillWave
          size={24}
          className="text-purple-500"
          title="Cryptocurrency"
        />
      )
    } else {
      return <span>{method}</span>
    }
  }
  return (
    <div>
      <Card className="col-span-1 md:col-span-2 lg:grid-cols-3">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Recent Transactions
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Overview of your recent financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <Typography variant="h2">
                Total Deposits Since Account Creation
              </Typography>
              <Typography
                variant="h1"
                className="text-lg font-semibold !text-green-600"
              >
                USD {wallet?.totalDeposits?.toLocaleString() || '0.00'}
              </Typography>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <Typography variant="h2">
                Total Withdrawals Since Account Creation
              </Typography>
              <Typography
                variant="h1"
                className="text-lg font-semibold !text-red-600"
              >
                USD {wallet?.totalWithdrawal?.toLocaleString() || '0.00'}
              </Typography>
            </div>
          </div>
        </CardContent>

        <CardContent>
          <div className=" w-full flex flex-col gap-[0.5rem] md:flex-row justify-between items-center mb-4 ">
            <div className="relative w-full mb-[0.5rem] md:mb-0 md:w-64">
              <Input
                type="text"
                placeholder="Search eg., ref-ghkkgiz2d"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="w-full justify-end flex flex-col md:flex-row md:items-center gap-[0.5rem]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={transactionTypeFilter}
                onValueChange={setTransactionTypeFilter}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                  <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display "No data available" if there are no transactions */}
          {transactions?.length === 0 ? (
            <div className="text-center my-4">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#Ref</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.map((transaction) => (
                    <TableRow key={transaction.reference}>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>{transaction.transactionType}</TableCell>
                      <TableCell className="flex items-center gap-2 capitalize">
                        {getPaymentIcon(transaction.paymentMethod)}
                        <Typography variant="span">
                          {transaction.paymentMethod}
                        </Typography>
                      </TableCell>
                      <TableCell>USD{transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {transaction.createdAt instanceof Timestamp
                          ? new Date(
                              transaction.createdAt.seconds * 1000
                            ).toLocaleString()
                          : 'Invalid Date'}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(transaction.transactionStatus)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {transactions.length > 10 && !showAllTransactions && (
            <div className="mt-4 text-center">
              <Button
                variant="secondary"
                onClick={() => setShowAllTransactions(true)}
              >
                Show More
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Transactions
