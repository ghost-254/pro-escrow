//lib/stores/store.ts

"use client";

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { combineReducers } from "redux";

import transactReducer from "@/lib/slices/transact.reducer";
import chatMoreInfoReducer from "@/lib/slices/chat.moreinfo.reducer";
import addFundsReducer from "@/lib/slices/addfunds.reducer";
import authReducer from "@/lib/slices/authSlice";
import groupCreationReducer from "@/lib/slices/groupCreationSlice";
import depositInfoReducer from "@/lib/slices/deposit.info.reducer";

// Configure Redux Persist to whitelist both 'depositInfo' and 'groupCreation'
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["depositInfo", "groupCreation"],
};

const rootReducer = combineReducers({
  transact: transactReducer,
  chatInfo: chatMoreInfoReducer,
  addFunds: addFundsReducer,
  auth: authReducer,
  groupCreation: groupCreationReducer, // Now persisted
  depositInfo: depositInfoReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
