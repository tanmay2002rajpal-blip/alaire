"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DailySales {
  date: string
  revenue: number
  orders: number
}

interface SalesChartProps {
  data: DailySales[]
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2">{formatDate(label || "")}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className={`w-3 h-3 rounded-full ${
              entry.dataKey === "revenue" ? "bg-primary" : "bg-blue-400"
            }`}
          />
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-medium">
            {entry.dataKey === "revenue"
              ? `₹${entry.value.toLocaleString("en-IN")}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SalesChart({ data }: SalesChartProps) {
  // Take last 14 days for better visibility
  const chartData = data.slice(-14)

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
