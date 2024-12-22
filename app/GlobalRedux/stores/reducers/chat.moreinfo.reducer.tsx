'use client'
import { createSlice } from '@reduxjs/toolkit'

interface ChatMoreInfoState {
  open: boolean
}

const initialState: ChatMoreInfoState = {
  open: false,
}

export const chatMoreInfoSlice = createSlice({
  name: 'chatInfo',
  initialState,
  reducers: {
    toggleShowDetailedChatInfoModal: (state) => {
      state.open = !state.open // Toggle the state between true and false
    },
  },
})

export const { toggleShowDetailedChatInfoModal } = chatMoreInfoSlice.actions

export default chatMoreInfoSlice.reducer
