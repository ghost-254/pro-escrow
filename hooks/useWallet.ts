// hooks/useWallet.ts
import { WalletContext } from '../context/walletContext'
import { useContext } from 'react'

const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export default useWallet
