"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarDaysIcon, ClockIcon } from "lucide-react"
import { Reminders } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
    reminders: Reminders[]
}

export const ReminderList = ({ reminders }: Props) => {
    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(true);

    const filteredReminders = useMemo(() => {
        const sorted = [...reminders].sort((a, b) => {
            return sortAsc
                ? new Date(a.time).getTime() - new Date(b.time).getTime()
                : new Date(b.time).getTime() - new Date(a.time).getTime()
        })

        return sorted.filter((r) => {
            const fullText = `${r.title} ${r.description ?? ""} ${r.pushName} ${r.remoteJid}`.toLowerCase()
            return fullText.includes(search.toLowerCase())
        })
    }, [reminders, search, sortAsc])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
                <Input
                    placeholder="Buscar por título, número o nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:max-w-sm"
                />
                <Button variant="ghost" onClick={() => setSortAsc(!sortAsc)}>
                    {sortAsc ? "Más recientes primero" : "Más antiguos primero"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredReminders.map((reminder) => (
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
                                Enviar a <strong className="ml-1">{reminder.pushName}</strong>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                {reminder.remoteJid.split("@")[0]} | {reminder.instanceName}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredReminders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-8">
                    No se encontraron recordatorios.
                </p>
            )}
        </div>
    )
}