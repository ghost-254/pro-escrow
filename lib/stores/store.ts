// store.ts
'use client'
import { configureStore } from '@reduxjs/toolkit'
import transactReducer from '@/lib/slices/transact.reducer'
import chatMoreInfoReducer from '@/lib/slices/chat.moreinfo.reducer'
import addFundsReducer from '@/lib/slices/addfunds.reducer'
import authReducer from '@/lib/slices/authSlice'
import groupCreationReducer from '@/lib/slices/groupCreationSlice'

export const store = configureStore({
  reducer: {
    transact: transactReducer,
    chatInfo: chatMoreInfoReducer,
    addFunds: addFundsReducer,
    auth: authReducer,
    groupCreation: groupCreationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
