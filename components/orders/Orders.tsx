'use client'
import React, { useState } from 'react'
import Typography from '../ui/typography'
import {
  Pagination,
  PaginationContent,
  // PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Copy, GitCommit, MessageCircle, Users } from 'lucide-react'
import { Button } from '../ui/button'

interface Order {
  id: string
  orderDate: string
  orderType: string
  buyer: string
  seller: string
  amount: string
  currency: string
  paymentStatus: string
  escrowStatus: string
  deliveryDate: string
  deliveryStatus: string
  overallStatus: string
  lastActivity: string
}
// eslint-disable-next-line id-length
const mockOrders: Order[] = Array.from({ length: 50 }, (_, index) => ({
  id: `${index + 1}`,
  orderDate: '2025-01-01',
  orderType: index % 2 === 0 ? 'Product' : 'Service',
  buyer: `Buyer ${index + 1}`,
  seller: `Seller ${index + 1}`,
  amount: `${(Math.random() * 1000).toFixed(2)}`,
  currency: 'USD',
  paymentStatus: index % 3 === 0 ? 'Pending' : 'Completed',
  escrowStatus: index % 4 === 0 ? 'Held in Escrow' : 'Released',
  deliveryDate: '2025-01-10',
  deliveryStatus: index % 2 === 0 ? 'Delivered' : 'Pending',
  overallStatus: index % 5 === 0 ? 'Disputed' : 'Completed',
  lastActivity: '2025-01-07 12:00 PM',
}))

const Orders: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calculate pagination
  const totalPages = Math.ceil(mockOrders.length / itemsPerPage)
  const currentOrders = mockOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="w-full max-h-screen mt-2 overflow-y-auto pb-[17rem] md:pb-[3rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-[1rem] p-[0.5rem] lg:p-[1rem]">
        {currentOrders?.map((order) => (
          <div
            key={order.id}
            className="w-full shadow-md rounded-md p-[1rem] border"
          >
            <div className="w-full flex flex-col gap-[1rem]">
              <div className="flex justify-between  border-b-[1px] pb-[0.5rem] border-[#dddddd] dark:border-[#202020]">
                <div className="flex flex-col gap-[0.5rem]">
                  <div className="flex items-center gap-[0.5rem]">
                    <Typography
                      variant="p"
                      className="font-bold whitespace-nowrap"
                    >
                      Order #{order.id + 347834}
                    </Typography>
                    <Copy size={17} className="cursor-pointer" />{' '}
                    {/* Copy Icon */}
                  </div>
                  <Typography variant="span" className="font-semibold">
                    {order.orderDate + ' ' + ' 12:00' + 'AM'}
                  </Typography>
                </div>

                {/* Display Status Button */}
                <div className="mt-2">
                  {order.overallStatus === 'Completed' && (
                    <Button variant={"pending"} className='text-white'>
                      Pending
                    </Button>
                  )}
                  {order.overallStatus === 'Completeds' && (
                    <Button variant={'secondary'} className='text-white'>Completed</Button>
                  )}
                  {order.overallStatus === 'Disputed' && (
                    <Button variant={'destructive'} className='text-white'>Refunded</Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-[0.7rem]">
                <div className="flex items-center gap-[0.5rem]">
                  <Typography variant="p" className="font-medium">
                    Title:
                  </Typography>
                  <Typography
                    className="truncate cursor-default mr-auto font-semibold"
                    variant="p"
                  >
                    Buyer
                  </Typography>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-[0.5rem]">
                    <Typography variant="p" className="font-medium ">
                      Amount:
                    </Typography>
                    <Typography
                      variant="h1"
                      className="font-bold dark:text-white"
                    >
                      {order.amount} {order.currency}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-[0.5rem] font-semibold">
                    <Typography variant="span" className="text-[#2da966] ">
                      Escrow Fee:
                    </Typography>
                    <Typography variant="span" className="text-[#2da966] ">
                      3 USD
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-[0.5rem]">
                  {/* <Typography variant="p" className="font-medium"> */}
                  <Users className="w-4 h-4" />
                  <Typography variant="p" className="font-semibold">
                    3
                  </Typography>
                  <GitCommit className="w-4 h-4" />
                  <MessageCircle className="w-4 h-4 cursor-pointer hover:opacity-[0.77] ml-1" />
                </div>
                <div className="flex items-center gap-[0.5rem]">
                  <Typography variant="p" className="font-medium">
                    Role:
                  </Typography>
                  <Typography variant="p">Buyer</Typography>
                </div>
                <div className="flex items-center gap-[0.5rem]">
                  <Typography variant="p" className="font-medium">
                    Payment Method:
                  </Typography>
                  <Typography variant="p">Binance</Typography>
                </div>
                <div className="flex items-center gap-[0.5rem]">
                  <Typography variant="p" className="font-medium">
                    Closing:
                  </Typography>
                  <Typography variant="p">12-12-2025 17:30 PM</Typography>
                </div>

                <div className="flex items-center gap-[0.5rem]">
                  <Typography variant="p" className="font-medium">
                    Last Activity:
                  </Typography>
                  <Typography variant="p">{order.lastActivity}</Typography>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center lg:mt-6">
        <Pagination>
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                className={
                  currentPage === 1 ? 'opacity-50 pointer-events-none' : ''
                }
              />
            </PaginationItem>

            {/* Page Links */}
            {[...Array(totalPages)].map((index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={index + 1 === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(index + 1)
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages)
                    handlePageChange(currentPage + 1)
                }}
                className={
                  currentPage === totalPages
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default Orders
