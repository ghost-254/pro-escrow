import Image from 'next/image'

import { cn } from '@/lib/utils'

type BrandLogoProps = {
  alt?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}

export function BrandLogo({
  alt = 'Xcrow Logo',
  width = 90,
  height = 90,
  priority = false,
  className,
}: BrandLogoProps) {
  return (
    <>
      <Image
        src="/logo11xx.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
        className={cn('block h-auto w-auto object-contain dark:hidden', className)}
      />
      <Image
        src="/logo11X.png"
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
        className={cn('hidden h-auto w-auto object-contain dark:block', className)}
      />
    </>
  )
}
