// app/wallet/page.tsx

"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  DollarSign,
  CreditCard,
  ChevronDown,
  Search,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"

interface Transaction {
  id: number
  type: "Deposit" | "Withdrawal"
  amount: number
  date: string
  status: "Completed" | "Pending" | "Failed"
}

const recentTransactions: Transaction[] = [
  { id: 1, type: "Deposit", amount: 1000, date: "2023-07-01", status: "Completed" },
  { id: 2, type: "Withdrawal", amount: 500, date: "2023-06-28", status: "Pending" },
  { id: 3, type: "Deposit", amount: 2000, date: "2023-06-25", status: "Completed" },
  { id: 4, type: "Withdrawal", amount: 750, date: "2023-06-20", status: "Failed" },
  { id: 5, type: "Deposit", amount: 1500, date: "2023-06-15", status: "Completed" },
  { id: 6, type: "Withdrawal", amount: 1000, date: "2023-06-10", status: "Completed" },
  { id: 7, type: "Deposit", amount: 3000, date: "2023-06-05", status: "Pending" },
  { id: 8, type: "Withdrawal", amount: 250, date: "2023-06-01", status: "Completed" },
  { id: 9, type: "Deposit", amount: 500, date: "2023-05-28", status: "Failed" },
  { id: 10, type: "Withdrawal", amount: 2000, date: "2023-05-25", status: "Completed" },
  { id: 11, type: "Deposit", amount: 1750, date: "2023-05-20", status: "Completed" },
  { id: 12, type: "Withdrawal", amount: 800, date: "2023-05-15", status: "Pending" },
]

const processTransactionData = (transactions: Transaction[]) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const data = monthNames.map((month) => ({ name: month, deposits: 0, withdrawals: 0 }))

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date)
    const monthIndex = date.getMonth()
    const amount = transaction.amount

    if (transaction.type === "Deposit") {
      data[monthIndex].deposits += amount
    } else if (transaction.type === "Withdrawal") {
      data[monthIndex].withdrawals += amount
    }
  })

  return data.filter((month) => month.deposits > 0 || month.withdrawals > 0)
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  label?: string
}

const ChartTooltipContent: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  return (
    <div className="bg-white p-2 rounded shadow">
      <p className="label">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="item">
          {item.name}: ${item.value}
        </p>
      ))}
    </div>
  )
}

export default function WalletPage() {
  const [balance] = useState(10000.5)
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const depositOptions = ["Mpesa Paybill", "Cryptocurrency", "PayPal", "AirTM"]

  const chartData = processTransactionData(recentTransactions)

  const filteredTransactions = recentTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.date.includes(searchTerm) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = statusFilter === "All" || transaction.status === statusFilter
    return matchesSearch && matchesFilter
  })

  const displayedTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 10)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="success">Completed</Badge>
      case "Pending":
        return <Badge variant="warning">Pending</Badge>
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="container mx-auto py-6 px-4 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Wallet className="mr-2 h-5 w-5" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-3xl md:text-4xl font-bold">${balance.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowDownLeft className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Deposit Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount</Label>
                <Input id="deposit-amount" placeholder="Enter amount" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-method">Deposit Method</Label>
                <Select>
                  <SelectTrigger id="deposit-method">
                    <SelectValue placeholder="Select deposit method" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositOptions.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Deposit Funds
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Withdraw Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input id="withdraw-amount" placeholder="Enter amount" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-method">Withdrawal Method</Label>
                <Select>
                  <SelectTrigger id="withdraw-method">
                    <SelectValue placeholder="Select withdrawal method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Mpesa Paybill or Number</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="airtm">AirTM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="deposits" fill="#8884d8" name="Deposits" />
                  <Bar dataKey="withdrawals" fill="#82ca9d" name="Withdrawals" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 lg:grid-cols-3">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recent Transactions</CardTitle>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                  <Button variant="outline" onClick={() => setShowAllTransactions(true)}>
                    Show More
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}
