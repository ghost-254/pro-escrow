import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "firebase/auth"

// Define a serializable user type
interface SerializableUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  // Add other properties you need
}

interface AuthState {
  user: SerializableUser | null
  loading: boolean
  persist: boolean
}

const initialState: AuthState = {
  user: null,
  loading: true, // Start with loading true
  persist: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set user and update loading state
    setUser: (state, action: PayloadAction<User | null>) => {
      if (action.payload) {
        // Convert Firebase User to a serializable object
        const { uid, email, displayName, photoURL, emailVerified } = action.payload
        state.user = {
          uid,
          email,
          displayName,
          photoURL,
          emailVerified,
        }
      } else {
        state.user = null
      }
      state.loading = false // Set loading to false after user is set
    },
    // Set loading state explicitly
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    // Set persistence state
    setPersist: (state, action: PayloadAction<boolean>) => {
      state.persist = action.payload
    },
    // Reset the auth state (optional, for logout or cleanup)
    resetAuthState: (state) => {
      state.user = null
      state.loading = false
      state.persist = false
    },
  },
})

// Export actions
export const { setUser, setLoading, setPersist, resetAuthState } = authSlice.actions

// Export reducer
export default authSlice.reducer