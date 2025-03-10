// app/create-group/page.tsx
"use client"

import React from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import TransactionTypeForm from "@/components/CreateGroup/TransactionTypeForm"
import TransactionDetailsForm from "@/components/CreateGroup/TransactionDetailsForm"
import GroupConfirmation from "@/components/CreateGroup/GroupConfirmation"
import SellerNextStep from "@/components/CreateGroup/SellerNextStep"

const CreateGroupPage = () => {
  const { step, transactionType } = useSelector((state: RootState) => state.groupCreation)

  const renderStep = () => {
    switch (step) {
      case 1:
        return <TransactionTypeForm />
      case 2:
        return <TransactionDetailsForm />
      case 3:
        // If transactionType is "selling", render SellerNextStep; otherwise, show GroupConfirmation.
        return transactionType === "selling" ? <SellerNextStep /> : <GroupConfirmation />
      default:
        return <TransactionTypeForm />
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="min-h-full bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-center text-primary">
            Create Xcrow Group
          </h1>
          {renderStep()}
        </div>
      </div>
    </ScrollArea>
  )
}

export default CreateGroupPage
