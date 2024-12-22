'use client'
import { configureStore } from '@reduxjs/toolkit'
import transactReducer from '../stores/reducers/transact.reducer'
import chatMoreInfoReducer from '../stores/reducers/chat.moreinfo.reducer'

export const store = configureStore({
  reducer: {
    transact: transactReducer,
    chatInfo: chatMoreInfoReducer,

  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
