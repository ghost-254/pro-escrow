'use client'
import React from 'react'
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { Button } from '../ui/button'
import Typography from '../ui/typography'
import Search from '../search/Search'

type Transaction = {
  id: string
  type: 'Deposit' | 'Withdrawal'
  amount: number
  charge?: number
  method: string
  date: string
  status: 'Pending' | 'Completed' | 'Failed'
}

const Transactions: React.FC = () => {
  const data: Transaction[] = [
    {
      id: '1',
      type: 'Deposit',
      amount: 500,
      date: '2025-01-15 12:00 PM',
      status: 'Completed',
      method: 'Paypal',
    },
    {
      id: '2',
      type: 'Withdrawal',
      amount: 300,
      charge: 3,
      date: '2025-01-14 12:00 PM',
      status: 'Pending',
      method: 'Mpesa',
    },
    {
      id: '3',
      type: 'Deposit',
      amount: 1000,
      date: '2025-01-13 12:00 PM',
      status: 'Failed',
      method: 'Binance ID',
    },
    {
      id: '4',
      type: 'Deposit',
      amount: 700,
      date: '2025-01-12 12:00 PM',
      status: 'Completed',
      method: 'Crypto',
    },
    {
      id: '5',
      type: 'Withdrawal',
      amount: 200,
      charge: 7,
      date: '2025-01-11 12:00 PM',
      status: 'Pending',
      method: 'Paypal',
    },
  ]

  const columnHelper = createColumnHelper<Transaction>()

  const columns = [
    columnHelper.accessor('id', {
      header: 'Transaction ID',
      cell: (info) => <Typography variant="p" style={{whiteSpace:"nowrap"}}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => <Typography variant="p" style={{whiteSpace:"nowrap"}}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('method', {
      header: 'Method',
      cell: (info) => <Typography variant="p" style={{whiteSpace:"nowrap"}}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => (
        <Typography variant="p" style={{whiteSpace:"nowrap"}} className="font-bold">
          USD{info.getValue().toFixed(2)}
        </Typography>
      ),
    }),
    columnHelper.accessor('charge', {
      header: 'Fee',
      cell: (info) => {
        const transactionType = info.row.original.type
        const charge = info.getValue() // Get the value of charge

        // Only show the charge for withdrawals
        if (transactionType === 'Withdrawal') {
          return (
            <Typography variant="p" style={{whiteSpace:"nowrap"}} className="font-bold">
              {charge !== undefined ? `USD${charge.toFixed(2)}` : 'N/A'}
            </Typography>
          )
        }
        // Return a blank cell or "N/A" for deposits
        return <Typography variant="p" style={{whiteSpace:"nowrap"}}>N/A</Typography>
      },
    }),

    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => <Typography variant="p" style={{whiteSpace:"nowrap"}}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() as string

        // Map status to corresponding Button variant
        const variant =
          status === 'Pending'
            ? 'pending'
            : status === 'Completed'
              ? 'secondary'
              : 'destructive'

        return (
          <Button variant={variant} className="text-white cursor-text">
            {status}
          </Button>
        )
      },
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 3, // Number of rows per page
      },
    },
  })

  return (
    <div className="w-full lg:p-4 p-[0.5rem] flex flex-col gap-[1rem]">
      <div className="w-full flex flex-col md:flex-row gap-[0.5rem] md:justify-between lg:items-center">
        <Typography variant="h1" className="font-bold dark:text-white">
          Transactions
        </Typography>
        <div className="relative">
          <Search />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border whitespace-nowrap">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup?.headers?.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm">
                    {typeof cell.column.columnDef.cell === 'function'
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.getValue()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="mt-4 flex items-center gap-[1rem] ml:ml-auto justify-center">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <div>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Transactions
