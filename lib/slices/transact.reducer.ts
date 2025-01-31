'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TransactState {
  open: boolean
  paymentDetails?: string 
  paymentMethod?: string  
  amount?: string       
}

const initialState: TransactState = {
  open: false,
  paymentDetails: '', 
  paymentMethod: '',  
  amount: '',         
}

export const transactSlice = createSlice({
  name: 'transact',
  initialState,
  reducers: {
    toggleTransactModal: (state) => {
      state.open = !state.open // Toggle the state between true and false
    },
    setPaymentDetails: (state, action: PayloadAction<string>) => {
      state.paymentDetails = action.payload // Update paymentDetails
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload // Update paymentMethod
    },
    setAmount: (state, action: PayloadAction<string>) => {
      state.amount = action.payload // Update amount
    },
  },
})

// Export actions
export const { toggleTransactModal, setPaymentDetails, setPaymentMethod, setAmount } = transactSlice.actions

// Export reducer
export default transactSlice.reducer