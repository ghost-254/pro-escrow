'use client'

import React from 'react'
import { Button } from '../ui/button'
import Typography from '../ui/typography'

interface HistoryEntry {
  id: number
  type: 'invite' | 'transaction' | 'deposit'
  description: string
  timestamp: string
}

const History: React.FC = () => {
  const historyEntries: HistoryEntry[] = [
    {
      id: 1,
      type: 'invite',
      description: 'You have been invited to join Escrow 1500.',
      timestamp: '2025-01-07 10:00 AM',
    },
    {
      id: 2,
      type: 'transaction',
      description: 'Deposit: Transaction of $500 was successful.',
      timestamp: '2025-01-07 09:30 AM',
    },
    {
      id: 3,
      type: 'deposit',
      description: 'Withdrawal: Withdrawal of $1000 was made to your account.',
      timestamp: '2025-01-06 03:15 PM',
    },
  ]

  const handleAccept = (id: number) => {
    alert('Invitation Accepted!' + id)
  }

  const handleDecline = (id: number) => {
    alert('Invitation Declined!' + id)
  }

  return (
    <div className="lg:p-[1rem] p-[0.5rem]">
      <div className="flex flex-col gap-[1rem]">
        {historyEntries.map((entry) => (
          <div
            key={entry.id}
            className="md:p-[1rem] p-[0.5rem] flex flex-col gap-[0.3rem] border rounded-md shadow-sm bg-background hover:shadow-md transition"
          >
            <Typography variant="span">{entry.timestamp}</Typography>
            <Typography variant="p" className="dark:text-white">
              {entry.description}
            </Typography>

            {entry.type === 'invite' && (
              <div className="mt-2 w-full flex flex-col md:flex-row md:items-center gap-[0.5rem]">
                <Button
                  variant={'default'}
                  onClick={() => handleAccept(entry.id)}
                >
                  Accept
                </Button>
                <Button
                  variant={'destructive'}
                  onClick={() => handleDecline(entry.id)}
                >
                  Decline
                </Button>
              </div>
            )}
            {entry.type !== 'invite' && (
              <div className="flex items-center gap-[0.5rem]">
                <Typography variant="p">Status</Typography>
                <Typography variant="p" className="!text-green-500">
                  Success
                </Typography>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default History
