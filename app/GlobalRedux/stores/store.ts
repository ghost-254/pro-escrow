'use client'
import { configureStore } from '@reduxjs/toolkit'
import transactReducer from '../stores/reducers/transact.reducer'

export const store = configureStore({
  reducer: {
    transact: transactReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
