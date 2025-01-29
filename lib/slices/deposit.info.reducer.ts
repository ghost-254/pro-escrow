// transactionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TransactionState {
  amount: number | null
  paymentMethod: string | null
  paymentDetails: string | null | undefined // Allow undefined
}

const initialState: TransactionState = {
  amount: null,
  paymentMethod: null,
  paymentDetails: null,
}

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactionData: (state, action: PayloadAction<TransactionState>) => {
      state.amount = action.payload.amount
      state.paymentMethod = action.payload.paymentMethod
      state.paymentDetails = action.payload.paymentDetails
    },
    clearTransactionData: (state) => {
      state.amount = null
      state.paymentMethod = null
      state.paymentDetails = null
    },
  },
})

export const { setTransactionData, clearTransactionData } =
  transactionSlice.actions

export default transactionSlice.reducer
