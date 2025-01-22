import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "firebase/auth"

interface AuthState {
  user: User | null
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
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.loading = false
      state.persist = true
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setPersist: (state, action: PayloadAction<boolean>) => {
      state.persist = action.payload
    },
  },
})

export const { setUser, setLoading, setPersist } = authSlice.actions
export default authSlice.reducer

