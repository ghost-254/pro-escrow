// transactionSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TransactionState {
  amount: number | null
  paymentMethod: string | null
}

const initialState: TransactionState = {
  amount: null,
  paymentMethod: null,
}

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactionData: (state, action: PayloadAction<TransactionState>) => {
      state.amount = action.payload.amount
      state.paymentMethod = action.payload.paymentMethod
    },
    clearTransactionData: (state) => {
      state.amount = null
      state.paymentMethod = null
    },
  },
})

export const { setTransactionData, clearTransactionData } =
  transactionSlice.actions

export default transactionSlice.reducer
