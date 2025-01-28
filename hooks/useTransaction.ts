// hooks/useTransaction.ts
import { TransactionContext } from 'context/transactionContext'
import { useContext } from 'react'

const useTransaction = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransaction must be used within TransactionProvider')
  }
  return context
}

export default useTransaction
