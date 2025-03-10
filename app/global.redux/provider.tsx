//app/global.redux/provider.tsx

'use client'

import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/lib/stores/store'

// Define props type for the Providers component
interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>
}
