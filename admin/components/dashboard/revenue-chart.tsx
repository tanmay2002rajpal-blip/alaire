"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatPrice } from "@/lib/utils"

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    payload: RevenueData
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="grid gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Date
          </span>
          <span className="font-bold text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Revenue
          </span>
          <span className="font-bold">
            {formatPrice(data.revenue)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Orders
          </span>
          <span className="font-bold text-muted-foreground">
            {data.orders}
          </span>
        </div>
      </div>
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format currency for Y-axis
  const formatYAxis = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`
    }
    return `₹${value}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
