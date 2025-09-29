"use client"

import { useState, useEffect } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AddTransactionForm } from "@/components/add-transaction-form"
import { EditTransactionForm } from "@/components/edit-transaction-form"

interface SummaryData {
  income: {
    total: number
    change: number
  }
  expense: {
    total: number
    change: number
  }
  difference: {
    total: number
    change: number
  }
}

interface SectionCardsProps {
  dateRange?: DateRange
  onRefresh?: () => void
  refreshKey?: number
}

export function SectionCards({ dateRange, onRefresh, refreshKey }: SectionCardsProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchSummaryData = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const token = localStorage.getItem('auth_token')
      
      let url = '/api/transactions/summary'
      if (dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd')
        const endDate = format(dateRange.to, 'yyyy-MM-dd')
        url += `?startDate=${startDate}&endDate=${endDate}`
        console.log(`Summary: Sending date range - from: ${dateRange.from}, to: ${dateRange.to}, formatted: ${startDate} to ${endDate}`)
      } else if (dateRange?.from) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd')
        url += `?startDate=${startDate}`
        console.log(`Summary: Sending start date only - from: ${dateRange.from}, formatted: ${startDate}`)
      } else if (dateRange?.to) {
        const endDate = format(dateRange.to, 'yyyy-MM-dd')
        url += `?endDate=${endDate}`
        console.log(`Summary: Sending end date only - to: ${dateRange.to}, formatted: ${endDate}`)
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      } else {
        setError("Nem sikerült az összefoglaló adatok betöltése")
      }
    } catch (error) {
      console.error("Fetch summary error:", error)
      setError("Hálózati hiba. Kérjük, próbálja újra.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummaryData()
  }, [dateRange, refreshKey])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getTrendIcon = (change: number) => {
    return change >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />
  }

  const getTrendText = (change: number, type: string) => {
    if (change >= 0) {
      return `Fel ${Math.abs(change).toFixed(1)}% ebben az időszakban`
    } else {
      return `Le ${Math.abs(change).toFixed(1)}% ebben az időszakban`
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 px-0 py-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
      </div>
    )
  }

  const data = summaryData || {
    income: { total: 0, change: 0 },
    expense: { total: 0, change: 0 },
    difference: { total: 0, change: 0 }
  }
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-0 py-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-3 lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      <Card className="@container/card gradient-orange-background">
        <CardHeader className="px-4 py-2 lg:px-6 lg:py-3">
          <CardDescription className="text-base font-semibold text-orange-700 dark:text-orange-300">Bevétel</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl lg:text-2xl lg:@[250px]/card:text-3xl">
            {formatCurrency(data.income.total)}
          </CardTitle>
          <CardAction>
            <Badge variant={data.income.change >= 0 ? "default" : "outline"}>
              {getTrendIcon(data.income.change)}
              {formatPercentage(data.income.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm px-4 py-2 lg:px-6 lg:py-3">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getTrendText(data.income.change, 'income')}
          </div>
          <div className="text-muted-foreground">
            {data.income.change >= 0 ? 'Bevétel növekszik' : 'Bevétel figyelmet igényel'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <AddTransactionForm type="income" onSuccess={() => {
              fetchSummaryData()
              onRefresh?.()
            }} />
            <EditTransactionForm type="income" onSuccess={() => {
              fetchSummaryData()
              onRefresh?.()
            }} />
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 py-2 lg:px-6 lg:py-3">
          <CardDescription className="text-base font-semibold text-red-700 dark:text-red-300">Kiadás</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl lg:text-2xl lg:@[250px]/card:text-3xl">
            {formatCurrency(data.expense.total)}
          </CardTitle>
          <CardAction>
            <Badge variant={data.expense.change >= 0 ? "outline" : "default"}>
              {getTrendIcon(data.expense.change)}
              {formatPercentage(data.expense.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm px-4 py-2 lg:px-6 lg:py-3">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getTrendText(data.expense.change, 'expense')}
          </div>
          <div className="text-muted-foreground">
            {data.expense.change >= 0 ? 'Kiadások növekednek' : 'Kiadások kontroll alatt'}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <AddTransactionForm type="expense" onSuccess={() => {
              fetchSummaryData()
              onRefresh?.()
            }} />
            <EditTransactionForm type="expense" onSuccess={() => {
              fetchSummaryData()
              onRefresh?.()
            }} />
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="px-4 py-2 lg:px-6 lg:py-3">
          <CardDescription className="text-base font-semibold text-white-700 dark:text-white-300">Különbség</CardDescription>
          <CardTitle className={`text-lg font-semibold tabular-nums @[250px]/card:text-xl lg:text-2xl lg:@[250px]/card:text-3xl ${
            data.difference.total >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(data.difference.total)}
          </CardTitle>
          <CardAction>
            <Badge variant={data.difference.total >= 0 ? "default" : "outline"}>
              {getTrendIcon(data.difference.total)}
              {formatPercentage(data.difference.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm px-4 py-2 lg:px-6 lg:py-3">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data.difference.total >= 0 ? 'Pozitív egyenleg' : 'Negatív egyenleg'}
          </div>
          <div className="text-muted-foreground">
            {data.difference.total >= 0 ? 'A pénzügyi egészség jó' : 'Kiadások áttekintése szükséges'}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
