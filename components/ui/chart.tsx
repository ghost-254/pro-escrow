// ./components/ui/chart.tsx

"use client"

import React from "react"
import { BarChartIcon } from "lucide-react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Re-exporting Recharts components for easier imports elsewhere
export {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
}

// Interface for ChartContainer props
interface ChartContainerProps {
  children: React.ReactNode
}

// ChartContainer Component without the unused 'config' prop
export const ChartContainer: React.FC<ChartContainerProps> = ({ children }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <BarChartIcon className="h-24 w-24 text-muted-foreground/20" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Interface for ChartTooltip props
interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
  }>
}

// ChartTooltip Component without the unused 'label' prop and with proper typing
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length >= 2) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
            <span className="font-bold text-muted-foreground">${payload[0].value}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[1].name}</span>
            <span className="font-bold text-muted-foreground">${payload[1].value}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Interface for ChartTooltipContent props
interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
  }>
  label?: string | number
}

// ChartTooltipContent Component with proper typing
export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col">
          {label !== undefined && (
            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
          )}
          {payload.map((item, index) => (
            <span key={index} className="font-bold text-muted-foreground">
              {item.name}: ${item.value}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return null
}
