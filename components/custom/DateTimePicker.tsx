'use client'

import { useEffect, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format, isValid, parse, setHours, setMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function DateTimePicker({
    value,
    onChange
}: {
    value: string | undefined
    onChange: (val: string) => void
}) {
    const parsedInitial = value
        ? parse(value, "dd/MM/yyyy HH:mm", new Date())
        : new Date();

    // ✅ Si no es válida, usamos new Date()
    const initialDate = isValid(parsedInitial) ? parsedInitial : new Date()

    const [date, setDate] = useState<Date>(initialDate)
    const [hour, setHour] = useState(initialDate.getHours())
    const [minute, setMinute] = useState(initialDate.getMinutes())

    useEffect(() => {
        const updated = setMinutes(setHours(date, hour), minute)
        onChange(format(updated, "dd/MM/yyyy HH:mm"))
    }, []) // solo al montar

    const updateDateTime = (newDate?: Date, newHour?: number, newMinute?: number) => {
        const base = newDate ?? date
        const h = newHour ?? hour
        const m = newMinute ?? minute
        const updated = setMinutes(setHours(base, h), m)

        setDate(updated)
        setHour(h)
        setMinute(m)
        onChange(format(updated, "dd/MM/yyyy HH:mm"))

    }

    return (
        <div className="gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                        {date ? format(date, "dd/MM/yyyy HH:mm") : "Seleccionar fecha y hora"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" >
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && updateDateTime(d)}
                    />

                    <div className="flex gap-2">
                        <div className="flex flex-col w-1/2">
                            <label className="text-sm text-muted-foreground mb-1">Hora</label>
                            <select
                                className={cn("border rounded-md px-2 py-1 text-sm bg-background")}
                                value={hour}
                                onChange={(e) => updateDateTime(undefined, parseInt(e.target.value), undefined)}
                            >
                                {[...Array(24)].map((_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col w-1/2">
                            <label className="text-sm text-muted-foreground mb-1">Minuto</label>
                            <select
                                className={cn("border rounded-md px-2 py-1 text-sm bg-background")}
                                value={minute}
                                onChange={(e) => updateDateTime(undefined, undefined, parseInt(e.target.value))}
                            >
                                {[0, 15, 30, 45].map((m) => (
                                    <option key={m} value={m}>
                                        {m.toString().padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}