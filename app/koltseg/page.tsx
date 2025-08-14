"use client"

import React from "react";
import { useId, useState } from "react"
import { DateRange } from "react-day-picker"
import { SectionCards } from "@/components/section-cards";
import DatePicker from "@/components/comp-512(date-picker)";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { addDays, subDays } from "date-fns"
import { DataTable } from "@/components/data-table"
import data from "@/app/dashboard/data.json"

export default function Koltseg() {
  const id = useId()
  // Remove the default date range preload
  const [date, setDate] = useState<DateRange | undefined>(undefined)
  
  return (

    <div className="main-div">
     <div>
     <DatePicker date={date} setDate={setDate} />
    </div>
      <div>
        <SectionCards>
        </SectionCards>
      </div>
      <div>
        <ChartAreaInteractive date={date} />
        </div>

      <div>
        <DataTable data={data} />
      </div>
</div>



  );
}