"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClientInterface } from "@/lib/types"
import {
    CheckCircle2Icon,
    AlertTriangleIcon,
    PowerOffIcon,
    PlugZapIcon,
    UsersIcon
} from "lucide-react"

interface ClientStatusSummaryProps {
    users: ClientInterface[]
}

export const ClientStatusPanel = ({ users }: ClientStatusSummaryProps) => {
    const total = users.length

    const desconectadoApagado = users.filter(u => u.qrStatus && !u.isEvoEnabled).length
    const desconectadoEncendido = users.filter(u => u.qrStatus && u.isEvoEnabled).length
    const conectadoApagado = users.filter(u => !u.qrStatus && !u.isEvoEnabled).length
    const encendido = users.filter(u => !u.qrStatus && u.isEvoEnabled).length

    return (
        <TooltipProvider>
            <div className="flex items-center gap-3">

                {/* Total */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className="bg-muted text-foreground gap-1 text-sm px-2 py-1">
                            <UsersIcon className="size-4 text-muted-foreground" />
                            {total}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Total de usuarios</TooltipContent>
                </Tooltip>

                {/* Desconectado - Apagado */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className="bg-red-600 text-white gap-1 text-sm px-2 py-1">
                            <PowerOffIcon className="size-4" />
                            {desconectadoApagado}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Desconectado - Apagado</TooltipContent>
                </Tooltip>

                {/* Desconectado - Encendido */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className="bg-yellow-500 text-white gap-1 text-sm px-2 py-1">
                            <AlertTriangleIcon className="size-4" />
                            {desconectadoEncendido}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Desconectado - Encendido</TooltipContent>
                </Tooltip>

                {/* Conectado - Apagado */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className="bg-blue-500 text-white gap-1 text-sm px-2 py-1">
                            <PlugZapIcon className="size-4" />
                            {conectadoApagado}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Conectado - Apagado</TooltipContent>
                </Tooltip>

                {/* Encendido */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className="bg-green-600 text-white gap-1 text-sm px-2 py-1">
                            <CheckCircle2Icon className="size-4" />
                            {encendido}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Encendido</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
