"use client"

import React from "react";
import { useId, useState } from "react"
import { DateRange } from "react-day-picker"
import { SectionCards } from "@/components/section-cards";
import DatePicker from "@/components/comp-512(date-picker)";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { TransactionTable } from "@/components/transaction-table"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  const id = useId()
  const [date, setDate] = useState<DateRange | undefined>(undefined)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Költség</h1>
          <p className="text-muted-foreground">
            Költségkövetés és kiadáskezelés
          </p>
        </div>
        
        <div>
          <DatePicker date={date} setDate={setDate} />
        </div>
        
        <div>
          <SectionCards dateRange={date} onRefresh={handleRefresh} refreshKey={refreshKey} />
        </div>
        
        <div>
          <ChartAreaInteractive date={date} refreshKey={refreshKey} />
        </div>

        <div>
          <TransactionTable dateRange={date} refreshKey={refreshKey} onRefresh={handleRefresh} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
