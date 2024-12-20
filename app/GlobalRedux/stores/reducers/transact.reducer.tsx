'use client'
import { createSlice } from '@reduxjs/toolkit'

interface TransactState {
  open: boolean
}

const initialState: TransactState = {
  open: false,
}

export const transactSlice = createSlice({
  name: 'transact',
  initialState,
  reducers: {
    toggleShowTransactModal: (state) => {
      state.open = !state.open // Toggle the state between true and false
    },
  },
})

export const { toggleShowTransactModal } = transactSlice.actions

export default transactSlice.reducer
