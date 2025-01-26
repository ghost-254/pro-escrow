import React, { useState } from 'react'
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

function Transactions() {
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const transactions = [
    {
      id: 1,
      type: 'Deposit',
      amount: 1000,
      date: '2023-07-01',
      status: 'Completed',
    },
    {
      id: 2,
      type: 'Withdrawal',
      amount: 500,
      date: '2023-06-28',
      status: 'Pending',
    },
    {
      id: 3,
      type: 'Deposit',
      amount: 2000,
      date: '2023-06-25',
      status: 'Completed',
    },
    {
      id: 4,
      type: 'Withdrawal',
      amount: 750,
      date: '2023-06-20',
      status: 'Failed',
    },
    {
      id: 5,
      type: 'Deposit',
      amount: 1500,
      date: '2023-06-15',
      status: 'Completed',
    },
    {
      id: 6,
      type: 'Withdrawal',
      amount: 1000,
      date: '2023-06-10',
      status: 'Completed',
    },
    {
      id: 7,
      type: 'Deposit',
      amount: 3000,
      date: '2023-06-05',
      status: 'Pending',
    },
    {
      id: 8,
      type: 'Withdrawal',
      amount: 250,
      date: '2023-06-01',
      status: 'Completed',
    },
    {
      id: 9,
      type: 'Deposit',
      amount: 500,
      date: '2023-05-28',
      status: 'Failed',
    },
    {
      id: 10,
      type: 'Withdrawal',
      amount: 2000,
      date: '2023-05-25',
      status: 'Completed',
    },
    {
      id: 11,
      type: 'Deposit',
      amount: 1750,
      date: '2023-05-20',
      status: 'Completed',
    },
    {
      id: 12,
      type: 'Withdrawal',
      amount: 800,
      date: '2023-05-15',
      status: 'Pending',
    },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.date.includes(searchTerm) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      statusFilter === 'All' || transaction.status === statusFilter

    return matchesSearch && matchesFilter
  })

  const displayedTransactions = showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 10)

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
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-64">
              <Input
                type="text"
                placeholder="Search transactions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
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
          </div>
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {displayedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length > 10 && !showAllTransactions && (
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
