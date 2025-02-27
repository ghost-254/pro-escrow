// lib/slices/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit"

// Our serializable user type—includes top-level numeric balances.
export interface SerializableUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  userUsdBalance: number
  userKesBalance: number
  frozenUserUsdBalance: number
  frozenUserKesBalance: number
}

interface AuthState {
  user: SerializableUser | null
  loading: boolean
  persist: boolean
}

const initialState: AuthState = {
  user: null,
  loading: true,
  persist: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Sets the main Firebase User in Redux when logging in, etc.
     * Because firebase.auth.User is not serializable, we must map it
     * into our custom SerializableUser shape.
     */
    setUser: (state, action: PayloadAction<SerializableUser | null>) => {
      if (action.payload) {
        state.user = action.payload
      } else {
        state.user = null
      }
      state.loading = false
    },

    /**
     * setUserDoc is for updating the user's Firestore data (balances, etc.)
     * once we read them from the DB. If the Firestore doc has fields for:
     * userUsdBalance, userKesBalance, frozenUserUsdBalance, and frozenUserKesBalance,
     * we update them accordingly.
     */
    setUserDoc: (
      state,
      action: PayloadAction<{
        userUsdBalance?: number
        userKesBalance?: number
        frozenUserUsdBalance?: number
        frozenUserKesBalance?: number
      }>
    ) => {
      if (!state.user) return

      const { userUsdBalance, userKesBalance, frozenUserUsdBalance, frozenUserKesBalance } = action.payload

      if (typeof userUsdBalance === "number") {
        state.user.userUsdBalance = userUsdBalance
      }
      if (typeof userKesBalance === "number") {
        state.user.userKesBalance = userKesBalance
      }
      if (typeof frozenUserUsdBalance === "number") {
        state.user.frozenUserUsdBalance = frozenUserUsdBalance
      }
      if (typeof frozenUserKesBalance === "number") {
        state.user.frozenUserKesBalance = frozenUserKesBalance
      }
    },

    /**
     * Explicitly set loading state, e.g. when waiting for an async auth check.
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    /**
     * Enable/disable persistence (e.g. with redux-persist).
     */
    setPersist: (state, action: PayloadAction<boolean>) => {
      state.persist = action.payload
    },

    /**
     * Reset the auth state to the initial state.
     */
    resetAuthState: (state) => {
      state.user = null
      state.loading = false
      state.persist = false
    },
  },
})

export const {
  setUser,
  setUserDoc,
  setLoading,
  setPersist,
  resetAuthState,
} = authSlice.actions

export default authSlice.reducer