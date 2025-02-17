// components/wallet/TransactionsTable.tsx

/* eslint-disable */

"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Transaction } from "@/../types/wallet"
import { getAuth } from "firebase/auth"
import { toast } from "react-toastify"


export function TransactionsTable({ searchTerm, filter }: { searchTerm: string; filter: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchTransactions = async () => {
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        try {
          const res = await fetch(`/api/transactions?uid=${currentUser.uid}`)
          const data = await res.json()
          if (data.success) {
            setTransactions(data.transactions)
          } else {
            toast.error("Failed to fetch transactions")
          }
        } catch {
        }
      }
    }
    fetchTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = Object.values(transaction).some(
        (value) => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())
      )
      const matchesFilter = filter === "all" || transaction.type.toLowerCase() === filter.toLowerCase()
      return matchesSearch && matchesFilter
    })
  }, [transactions, searchTerm, filter])

  const displayedTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="rounded-md border max-h-[400px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.map((transaction) => (
              <TableRow key={transaction.ref}>
                <TableCell className="font-mono">{transaction.ref}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.method}</TableCell>
                <TableCell>
                  {transaction.currency} {transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.status.toLowerCase() === "paid"
                        ? "success"
                        : transaction.status.toLowerCase() === "failed"
                        ? "destructive"
                        : transaction.status.toLowerCase() === "completed"
                        ? "secondary"
                        : "warning"
                    }
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredTransactions.length > 10 && (
        <Button variant="outline" className="w-full" onClick={() => setShowAll(!showAll)}>
          {showAll ? (
            <>
              Show Less <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Show More <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
