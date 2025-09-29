"use client"

import { useId, useEffect, useState } from "react"
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from "date-fns"
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

  const handlePresetRange = (preset: string) => {
    const today = new Date()
    let range: DateRange

    switch (preset) {
      case 'today':
        range = {
          from: today,
          to: today
        }
        break
      case 'yesterday':
        const yesterday = subDays(today, 1)
        range = {
          from: yesterday,
          to: yesterday
        }
        break
      case 'lastWeek':
        range = {
          from: subWeeks(today, 1),
          to: today
        }
        break
      case 'lastMonth':
        range = {
          from: subMonths(today, 1),
          to: today
        }
        break
      case 'last3Months':
        range = {
          from: subMonths(today, 3),
          to: today
        }
        break
      default:
        return
    }

    setLocalDate(range)
    setDate(range)
  }

  return (
    <div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={id}>Megjelenítési időszak</Label>
        
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange('today')}
            className="text-xs"
          >
            Ma
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange('yesterday')}
            className="text-xs"
          >
            Tegnap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange('lastWeek')}
            className="text-xs"
          >
            Utolsó hét
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange('lastMonth')}
            className="text-xs"
          >
            Utolsó hónap
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetRange('last3Months')}
            className="text-xs"
          >
            Utolsó 3 hónap
          </Button>
        </div>

        <Popover onOpenChange={(open) => {
          if (!open) {
            // If only from date is selected, set to date to the same date
            if (localDate?.from && !localDate?.to) {
              const singleDayRange = {
                from: localDate.from,
                to: localDate.from
              }
              setLocalDate(singleDayRange)
              setDate(singleDayRange)
            } else {
              setDate(localDate)
            }
          }
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
              onSelect={(range) => {
                setLocalDate(range)
                // If only from date is selected, automatically set to date to the same date
                if (range?.from && !range?.to) {
                  setTimeout(() => {
                    const singleDayRange = {
                      from: range.from,
                      to: range.from
                    }
                    setLocalDate(singleDayRange)
                  }, 100)
                }
              }}
              locale={hu}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
