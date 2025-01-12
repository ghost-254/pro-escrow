'use client'
import { createSlice } from '@reduxjs/toolkit'

interface AddFundsState {
  open: boolean
}

const initialState: AddFundsState = {
  open: false,
}

export const addFundsSlice = createSlice({
  name: 'addFunds',
  initialState,
  reducers: {
    toggleAddFundsModal: (state) => {
      state.open = !state.open // Toggle the state between true and false
    },
  },
})

export const { toggleAddFundsModal } = addFundsSlice.actions

export default addFundsSlice.reducer
