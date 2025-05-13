'use client'

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format, setHours, setMinutes } from "date-fns"
import { useState } from "react"

export function DateTimePicker({
    value,
    onChange
}: {
    value: Date | undefined
    onChange: (date: Date) => void
}) {
    const [date, setDate] = useState<Date | undefined>(value ?? new Date())
    const [hour, setHour] = useState(date?.getHours() ?? 0)
    const [minute, setMinute] = useState(date?.getMinutes() ?? 0)

    const handleChange = (newDate: Date | undefined) => {
        if (!newDate) return
        const updated = setMinutes(setHours(newDate, hour), minute)
        setDate(updated)
        onChange(updated)
    }

    const updateTime = (newHour: number, newMinute: number) => {
        if (!date) return
        const updated = setMinutes(setHours(date, newHour), newMinute)
        setHour(newHour)
        setMinute(newMinute)
        setDate(updated)
        onChange(updated)
    }

    return (
        <div className="gap-2">
            <label className="block font-medium">Fecha y hora</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                        {date ? format(date, "PPPPp") : "Seleccionar fecha y hora"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="flex flex-col space-y-2">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleChange}
                    />
                    <div className="flex gap-2">
                        <select
                            className="border rounded px-2 py-1"
                            value={hour}
                            onChange={(e) => updateTime(parseInt(e.target.value), minute)}
                        >
                            {[...Array(24)].map((_, i) => (
                                <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                            ))}
                        </select>
                        :
                        <select
                            className="border rounded px-2 py-1"
                            value={minute}
                            onChange={(e) => updateTime(hour, parseInt(e.target.value))}
                        >
                            {[0, 15, 30, 45].map((m) => (
                                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                            ))}
                        </select>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}