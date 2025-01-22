'use client'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AddFundsState {
  type: string // 'withdraw'
  open: boolean
}

const initialState: AddFundsState = {
  type: '', // Initially empty
  open: false,
}

export const addFundsSlice = createSlice({
  name: 'addFunds',
  initialState,
  reducers: {
    toggleAddFundsModal: (state) => {
      state.open = !state.open // Toggle the modal open/close state
    },
    setAddFundsType: (state, action: PayloadAction<string>) => {
      state.type = action.payload // Set the type dynamically
    },
    resetAddFundsModal: (state) => {
      state.type = '' // Reset type to empty
      state.open = false // Close the modal
    },
  },
})

export const { toggleAddFundsModal, setAddFundsType, resetAddFundsModal } = addFundsSlice.actions

export default addFundsSlice.reducer
