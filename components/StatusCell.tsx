"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2Icon, PowerOffIcon, PlugZapIcon, AlertTriangleIcon } from "lucide-react"

interface StatusCellProps {
  isEvoEnabled: boolean
  qrStatus: boolean
}

export const StatusCell = ({ qrStatus, isEvoEnabled }: StatusCellProps) => {
  let statusLabel = ""
  let statusIcon = null
  let tooltipText = ""
  let badgeClass = "gap-1 text-sm px-2 py-1"

  if (qrStatus && !isEvoEnabled) {
    statusLabel = "Desconectado - apagado"
    statusIcon = <PowerOffIcon className="text-white size-4" />
    tooltipText = "El cliente no ha escaneado el QR y el robot está apagado"
    badgeClass += " bg-red-600 text-white"
  } else if (qrStatus && isEvoEnabled) {
    statusLabel = "Desconectado - encendido"
    statusIcon = <AlertTriangleIcon className="text-white size-4" />
    tooltipText = "El cliente no ha escaneado el QR pero el robot está encendido"
    badgeClass += " bg-yellow-500 text-white"
  } else if (!qrStatus && !isEvoEnabled) {
    statusLabel = "Conectado - apagado"
    statusIcon = <PlugZapIcon className="text-white size-4" />
    tooltipText = "El QR fue escaneado pero el robot está apagado"
    badgeClass += " bg-blue-500 text-white"
  } else if (!qrStatus && isEvoEnabled) {
    statusLabel = "Encendido"
    statusIcon = <CheckCircle2Icon className="text-white size-4" />
    tooltipText = "El robot está encendido y el QR fue escaneado correctamente"
    badgeClass += " bg-green-600 text-white"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={badgeClass}>
            {statusIcon}
            {statusLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}