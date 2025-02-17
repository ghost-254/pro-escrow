/* eslint-disable id-length */
import React from 'react'
import { cn } from '@/lib/utils'

type TypographyProps = {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' // Variant types
  children: React.ReactNode
  className?: string // Optional additional className for custom styling
  onClick?: React.MouseEventHandler<HTMLElement> // Optional onClick prop
  title?: string // Optional title prop
  style?: React.CSSProperties
}

const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className,
  onClick, // Destructure onClick prop
  title, // Destructure title prop
  style,
}) => {
  const baseStyles = 'dark:text-gray-400 text-gray-800' // Default text color for dark/light mode

  // Determine which variant to render
  const variantStyles = {
    h1: 'text-[1.1rem]', // Header 1: Large and bold
    h2: 'text-[1rem]', // Header 2: Medium large
    h3: 'text-[0.95rem]', // Header 3: Medium
    h4: 'text-[0.9rem]', // Header 4: Slightly smaller
    h5: 'text-[0.85rem]', // Header 5: Smaller
    h6: 'text-[0.8rem]', // Header 6: Smallest
    p: 'text-[0.95rem]', // Paragraph: Regular text
    span: 'text-sm', // Span: Smaller text
  }

  // Correctly infer the JSX element type using JSX.IntrinsicElements

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick} // Pass the onClick prop to the element
      title={title} // Pass the title prop to the element
      style={style}
    >
      {children}
    </div>
  )
}

export default Typography
