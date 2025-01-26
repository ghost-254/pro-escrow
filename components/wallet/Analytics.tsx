import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function Analytics() {
  interface Transaction {
    id: number
    type: 'Deposit' | 'Withdrawal'
    amount: number
    date: string
    status: 'Completed' | 'Pending' | 'Failed'
  }

  interface ChartTooltipProps {
    active?: boolean
    payload?: Array<{ name: string; value: number }>
    label?: string
  }
  
  const ChartTooltipContent: React.FC<ChartTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
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

  const recentTransactions: Transaction[] = [
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
  const processTransactionData = (transactions: Transaction[]) => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const data = monthNames.map((month) => ({
      name: month,
      deposits: 0,
      withdrawals: 0,
    }))

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthIndex = date.getMonth()
      const amount = transaction.amount

      if (transaction.type === 'Deposit') {
        data[monthIndex].deposits += amount
      } else if (transaction.type === 'Withdrawal') {
        data[monthIndex].withdrawals += amount
      }
    })

    return data.filter((month) => month.deposits > 0 || month.withdrawals > 0)
  }

  const chartData = processTransactionData(recentTransactions)

  return (
    <div>
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
    </div>
  )
}

export default Analytics
