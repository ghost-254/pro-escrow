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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search } from 'lucide-react'
import useTransaction from 'hooks/useTransaction'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/stores/store'
import { Timestamp } from 'firebase/firestore'

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
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div>
      <Card className="col-span-1 md:col-span-2 lg:grid-cols-3">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Recent Transactions
          </CardTitle>
        </CardHeader>
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
            <div className="w-full flex flex-col md:flex-row md:items-center gap-[0.5rem]">
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
                      <TableCell>{transaction.paymentMethod}</TableCell>
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
                variant="outline"
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
