// hooks/useAuth.ts
import { UserContext } from '../context/userContext'
import { useContext } from 'react'

const useAuth = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth
