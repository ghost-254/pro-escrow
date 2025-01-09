'use client'

import React, { useState } from 'react'

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
/* eslint-disable id-length */
const mockOrders: Order[] = Array.from({ length: 50 }, (_, index) => ({
  id: `ORD-${index + 1}`,
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

  return (
    <div className="max-h-screen overflow-y-auto pb-[13rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-[1rem]">
        {currentOrders.map((order) => (
          <div
            key={order.id}
            className="order-card bg-white shadow-md rounded-md p-4 border"
          >
            <h2 className="text-lg font-bold mb-2">Order #{order.id}</h2>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Order Date:</strong> {order.orderDate}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Order Type:</strong> {order.orderType}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Buyer:</strong> {order.buyer}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Seller:</strong> {order.seller}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Amount:</strong> {order.amount} {order.currency}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Payment Status:</strong> {order.paymentStatus}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Escrow Status:</strong> {order.escrowStatus}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Delivery Date:</strong> {order.deliveryDate}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Delivery Status:</strong> {order.deliveryStatus}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Status:</strong> {order.overallStatus}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Last Activity:</strong> {order.lastActivity}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="pagination mt-4 flex justify-center items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Orders
