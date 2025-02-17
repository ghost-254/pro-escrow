"use client";

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { combineReducers } from "redux";

import transactReducer from "@/lib/slices/transact.reducer";
import chatMoreInfoReducer from "@/lib/slices/chat.moreinfo.reducer";
import addFundsReducer from "@/lib/slices/addfunds.reducer";
import authReducer from "@/lib/slices/authSlice";

// Make sure to import your **revised** groupCreation slice here:
import groupCreationReducer from "@/lib/slices/groupCreationSlice";

import depositInfoReducer from "@/lib/slices/deposit.info.reducer";

// Configure Redux Persist to whitelist only 'depositInfo'
const persistConfig = {
  key: "root", // Key for localStorage
  storage,
  whitelist: ["depositInfo"], // Only 'depositInfo' will be persisted
};

// Combine all reducers
const rootReducer = combineReducers({
  transact: transactReducer,
  chatInfo: chatMoreInfoReducer,
  addFunds: addFundsReducer,
  auth: authReducer,
  groupCreation: groupCreationReducer, // This will NOT persist
  depositInfo: depositInfoReducer,
});

// Wrap your combined reducers with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the Redux store
export const store = configureStore({
  reducer: persistedReducer,
});

// Create the persistor (for storing `depositInfo` to localStorage)
export const persistor = persistStore(store);

// Redux store types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
