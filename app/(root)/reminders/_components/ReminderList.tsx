"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarDaysIcon, ClockIcon } from "lucide-react"
import { reminderListInterface } from "@/schema/reminder"

export const ReminderList = ({ reminder, workflow }: reminderListInterface) => {

    return (
        <Card key={reminder.id} className="border border-muted">
            <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-primary">
                        {reminder.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {reminder.repeatType === "NONE"
                            ? "Único"
                            : `${reminder.repeatType} cada ${reminder.repeatEvery}x`}
                    </span>
                </div>

                {reminder.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {reminder.description}
                    </p>
                )}

                <div className="flex items-center gap-2 text-sm">
                    <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(reminder.time), "PPPp")}
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    Enviar a <strong className="ml-1">+{reminder.remoteJid.split("@")[0]}</strong>
                </div>

                <div className="text-xs text-muted-foreground">
                    Flujo | {workflow?.name}
                </div>
            </CardContent>
        </Card>
    )
}