'use client'

import { useRouter } from 'next/navigation' // Correct import from next/navigation
import { ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'

export function GoBackButton() {
  const router = useRouter() // Use the hook inside the client component

  const handleGoBack = () => {
    router.back() // Go back to the previous page
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleGoBack}
    >
      <ArrowLeft className="h-6 w-6" />
    </Button>
  )
}
