"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClientInterface } from "@/lib/types"
import { User } from "@prisma/client"
import { CheckCircle2Icon, AlertTriangleIcon, PowerOffIcon, UsersIcon } from "lucide-react"

interface ClientStatusSummaryProps {
    users: ClientInterface[]
}

export const ClientStatusPanel = ({ users }: ClientStatusSummaryProps) => {
    const total = users.length
    const desconectados = users.filter(user => !user.isEvoEnabled && user.qrStatus).length
    const apagados = users.filter(user => !user.isEvoEnabled && !user.qrStatus).length
    const activos = users.filter(user => user.isEvoEnabled && !user.qrStatus).length

    return (
        <TooltipProvider>
            <div className="flex items-center gap-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-border gap-1 text-sm px-2 py-1">
                            <UsersIcon className="size-4 text-muted-foreground" />
                            {total}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Total de usuarios</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-border gap-1 text-sm px-2 py-1">
                            <AlertTriangleIcon className="size-4 text-yellow-500" />
                            {apagados}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Desconectados (QR escaneado pero robot apagado)</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-border gap-1 text-sm px-2 py-1">
                            <PowerOffIcon className="size-4 text-red-600" />
                            {desconectados}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Robot Apagado</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-border gap-1 text-sm px-2 py-1">
                            <CheckCircle2Icon className="size-4 text-green-600" />
                            {activos}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Activos (robot encendido, QR no escaneado)</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
