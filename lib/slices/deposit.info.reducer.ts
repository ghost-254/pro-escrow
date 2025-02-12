import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface TransactionState {
  amount: number | null
  paymentMethod: "mpesa" | "cryptocurrency" | null
  transactionType: "deposit" | "withdrawal" | null
  status: "pending" | "completed" | "failed" | null
}

const initialState: TransactionState = {
  amount: null,
  paymentMethod: null,
  transactionType: null,
  status: null,
}

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTransactionData: (state, action: PayloadAction<Partial<TransactionState>>) => {
      return { ...state, ...action.payload }
    },
    clearTransactionData: () => initialState,
    updateTransactionStatus: (state, action: PayloadAction<TransactionState["status"]>) => {
      state.status = action.payload
    },
  },
})

export const { setTransactionData, clearTransactionData, updateTransactionStatus } = transactionSlice.actions

export default transactionSlice.reducer
