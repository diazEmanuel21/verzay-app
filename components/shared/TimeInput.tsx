'use client'

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'

const unitToSeconds: Record<TimeUnit, number> = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
}

interface TimeInputProps {
    onChange?: (totalSeconds: number) => void
    onBlur?: () => void
    className?: string
}

export function TimeInput({ onChange, className, onBlur }: TimeInputProps) {
    const [unit, setUnit] = useState<TimeUnit>('seconds')
    const [value, setValue] = useState<number>(0)

    const maxSeconds = 30 * 24 * 60 * 60 // 30 días en segundos

    useEffect(() => {
        const total = value * unitToSeconds[unit]
        if (onChange) {
            onChange(Math.min(total, maxSeconds))
        }
    }, [value, unit, onChange])


    useEffect(() => {
        setValue(0)
    }, [unit]);


    return (
        <>
            <div className={cn(className)}>
                <Label className="text-xs">Duración de retraso. Maxímo 30 días</Label>
                <div className="flex flex-row gap-2 mt-2">
                    <Select value={unit} onValueChange={(val) => setUnit(val as TimeUnit)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="seconds">Segundos</SelectItem>
                            <SelectItem value="minutes">Minutos</SelectItem>
                            <SelectItem value="hours">Horas</SelectItem>
                            <SelectItem value="days">Días</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        min={0}
                        value={value}
                        onBlur={onBlur}
                        onChange={(e) => {
                            const num = parseInt(e.target.value, 10)
                            if (!isNaN(num)) {
                                const total = num * unitToSeconds[unit]
                                if (total <= maxSeconds) {
                                    setValue(num)
                                } else {
                                    const maxValue = Math.floor(maxSeconds / unitToSeconds[unit])
                                    setValue(maxValue)
                                }
                            } else {
                                setValue(0)
                            }
                        }}
                    />
                </div>
            </div>
        </>
    )
}
