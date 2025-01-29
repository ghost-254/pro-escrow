// store.js
'use client'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // default: localStorage
import transactReducer from '@/lib/slices/transact.reducer'
import chatMoreInfoReducer from '@/lib/slices/chat.moreinfo.reducer'
import addFundsReducer from '@/lib/slices/addfunds.reducer'
import authReducer from '@/lib/slices/authSlice'
import transactionReducer from '@/lib/slices/deposit.info.reducer'
// import { PersistGate } from 'redux-persist/integration/react'

// Persist config
const persistConfig = {
  key: 'root', // key for the persisted state in localStorage
  storage, // use localStorage for persistence
  whitelist: ['auth'], // persist only the 'auth' slice, add others if needed
}

// Combine your reducers
const rootReducer = combineReducers({
  transact: transactReducer,
  chatInfo: chatMoreInfoReducer,
  addFunds: addFundsReducer,
  auth: authReducer,
  transaction: transactionReducer,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
})

// export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
