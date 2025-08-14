"use client"

import { useId, useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function DatePicker({ date, setDate }: { date: DateRange | undefined, setDate: (range: DateRange | undefined) => void }) {
  const id = useId()
  const [localDate, setLocalDate] = useState<DateRange | undefined>(date)
  useEffect(() => {
    setLocalDate(date)
  }, [date])
  return (
    <div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={id}>Megjelenítési időszak</Label>
        <Popover onOpenChange={(open) => {
          if (!open) setDate(localDate)
        }}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className="group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
            >
              <span
                className={cn("truncate", !localDate && "text-muted-foreground")}
              >
                {localDate?.from ? (
                  localDate.to ? (
                    <>
                      {format(localDate.from, "LLL dd, y", { locale: hu })} -{" "}
                      {format(localDate.to, "LLL dd, y", { locale: hu })}
                    </>
                  ) : (
                    format(localDate.from, "LLL dd, y", { locale: hu })
                  )
                ) : (
                  "Válassz időszakot"
                )}
              </span>
              <CalendarIcon
                size={16}
                className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <Calendar
              mode="range"
              selected={localDate}
              onSelect={setLocalDate}
              locale={hu}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
