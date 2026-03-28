//lib/stores/store.ts

"use client";

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { combineReducers } from "redux";
import transactReducer from "@/lib/slices/transact.reducer";
import chatMoreInfoReducer from "@/lib/slices/chat.moreinfo.reducer";
import addFundsReducer from "@/lib/slices/addfunds.reducer";
import authReducer from "@/lib/slices/authSlice";
import groupCreationReducer from "@/lib/slices/groupCreationSlice";
import depositInfoReducer from "@/lib/slices/deposit.info.reducer";

const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: string) {
    return Promise.resolve(value);
  },
  removeItem() {
    return Promise.resolve();
  },
});

const storage =
  typeof window !== "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("redux-persist/lib/storage").default
    : createNoopStorage();

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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
