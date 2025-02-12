//components/wallet/AnalyticsChart.tsx
/* eslint-disable */

"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { useTheme } from "next-themes"
import type { AnalyticsData } from "@/../types/wallet"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface AnalyticsChartProps {
  data: AnalyticsData[]
  currency: "KES" | "USD"
}

export function AnalyticsChart({ data, currency }: AnalyticsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Deposits",
        data: data.map((d) => d.deposits),
        borderColor: "rgb(147, 51, 234)",
        backgroundColor: "rgba(147, 51, 234, 0.5)",
        tension: 0.3,
      },
      {
        label: "Withdrawals",
        data: data.map((d) => d.withdrawals),
        borderColor: "rgb(52, 211, 153)",
        backgroundColor: "rgba(52, 211, 153, 0.5)",
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "#fff" : "#000",
          callback: function(tickValue: number | string) {
            return `${currency} ${Number(tickValue).toLocaleString()}`
          },
        },
      },
      x: {
        grid: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDark ? "#fff" : "#000",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#fff" : "#000",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += `${currency} ${context.parsed.y.toLocaleString()}`
            }
            return label
          },
        },
      },
    },
  }

  return <Line data={chartData} options={options} />
}

