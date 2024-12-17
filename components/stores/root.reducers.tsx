import { combineReducers } from "redux";
import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Import reducers
// import userReducer from "./reducers/user.reducer";

// Create Saga middleware
const sagaMiddleware = createSagaMiddleware();

/**
 * Root reducer combining all reducers from different configurations.
 */
const rootReducerCombined = combineReducers({
  // Add your reducers here
  // user: userReducer,
});

/**
 * TypeScript type for the root state.
 */
export type RootState = ReturnType<typeof rootReducerCombined>;

/**
 * Configuration for Redux persist.
 */
const persistConfig = {
  key: "root",
  storage,
};

/**
 * Persisted reducer with the defined configuration.
 */
const persistedReducer = persistReducer(persistConfig, rootReducerCombined);

/**
 * Configure the store with the persisted reducer and middleware.
 */
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(sagaMiddleware),
});

/**
 * Persistor object for the Redux store.
 */
const persistor = persistStore(store);

/**
 * Run the Sagas (uncomment when sagas are added).
 */
// sagaMiddleware.run(userEffect);

export { store, persistor };
