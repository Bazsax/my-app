"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { format } from "date-fns"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DateRange } from "react-day-picker"

export const description = "Egy interaktív területdiagram"

interface ChartDataPoint {
  date: string
  income: number
  expenses: number
}

const chartConfig = {
  income: {
    label: "Bevétel",
    color: "#22c55e",
  },
  expenses: {
    label: "Kiadás",
    color: "#ef4444",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ date, refreshKey }: { date?: DateRange | undefined, refreshKey?: number }) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [pieData, setPieData] = useState<{name: string, value: number, color: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchChartData = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const token = localStorage.getItem('auth_token')
      
      let url = '/api/transactions/chart'
      
      console.log(`Chart: Received date prop:`, date)
      
      // Use date range from props if provided, otherwise use default (last 90 days)
      if (date?.from && date?.to) {
        const startDate = format(date.from, 'yyyy-MM-dd')
        const endDate = format(date.to, 'yyyy-MM-dd')
        url += `?startDate=${startDate}&endDate=${endDate}`
        console.log(`Chart: Sending date range - from: ${date.from}, to: ${date.to}, formatted: ${startDate} to ${endDate}`)
      } else if (date?.from) {
        const startDate = format(date.from, 'yyyy-MM-dd')
        url += `?startDate=${startDate}`
        console.log(`Chart: Sending start date only - from: ${date.from}, formatted: ${startDate}`)
      } else if (date?.to) {
        const endDate = format(date.to, 'yyyy-MM-dd')
        url += `?endDate=${endDate}`
        console.log(`Chart: Sending end date only - to: ${date.to}, formatted: ${endDate}`)
      } else {
        // Default to last 90 days if no date range provided
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 90)
        
        url += `?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        console.log(`Chart: Using default date range - last 90 days`)
      }

      console.log("Fetching chart data from:", url)
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Chart API response:", data)
        const chartDataArray = data.chartData || []
        setChartData(chartDataArray)
        
        // Calculate pie chart data (total income vs total expenses)
        const totalIncome = chartDataArray.reduce((sum: number, item: ChartDataPoint) => sum + item.income, 0)
        const totalExpenses = chartDataArray.reduce((sum: number, item: ChartDataPoint) => sum + item.expenses, 0)
        
        setPieData([
          { name: 'Bevétel', value: totalIncome, color: '#22c55e' },
          { name: 'Kiadás', value: totalExpenses, color: '#ef4444' }
        ])
      } else {
        const errorData = await response.json()
        console.error("Chart API error:", errorData)
        setError("Nem sikerült a diagram adatok betöltése")
      }
    } catch (error) {
      console.error("Fetch chart data error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData()
  }, [date, refreshKey])

  useEffect(() => {
    console.log("Chart data updated:", chartData)
  }, [chartData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' '
  }

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Pénzügyi áttekintés</CardTitle>
          <CardDescription>Diagram adatok betöltése...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Pénzügyi áttekintés</CardTitle>
          <CardDescription>Hiba a diagram adatok betöltésekor</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="aspect-auto h-[250px] w-full flex items-center justify-center">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Area Chart Card - 2/3 width */}
      <div className="flex-[2]">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Pénzügyi áttekintés</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Bevétel vs Kiadás időben
              </span>
              <span className="@[540px]/card:hidden">Bevétel vs Kiadás</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart data={chartData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: number) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`
                    }
                    return value.toString()
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  defaultIndex={Math.floor(chartData.length / 2)}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("hu-HU", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }}
                      formatter={(value, name) => [
                        <span style={{ color: name === "Bevétel" ? "#22c55e" : "#ef4444" }}>
                          {formatCurrency(Number(value))}
                        </span>,
                        name === "Bevétel" ? "Bevétel" : "Kiadás"
                      ]}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="income"
                  type="natural"
                  fill="url(#fillIncome)"
                  stroke="#22c55e"
                  stackId="a"
                  name="Bevétel"
                />
                <Area
                  dataKey="expenses"
                  type="natural"
                  fill="url(#fillExpenses)"
                  stroke="#ef4444"
                  stackId="a"
                  name="Kiadás"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Pie Chart Card - 1/3 width */}
      <div className="flex-[1]">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Bevétel vs Kiadás</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Összesített bontás kategóriánként
              </span>
              <span className="@[540px]/card:hidden">Összesített bontás</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        <span style={{ color: name === "Bevétel" ? "#22c55e" : "#ef4444" }}>
                          {formatCurrency(Number(value))}
                        </span>,
                        name
                      ]}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
