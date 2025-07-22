"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2Icon, XCircleIcon, AlertCircleIcon, AlertTriangleIcon, PowerOffIcon } from "lucide-react"

interface StatusCellProps {
  isEvoEnabled: boolean
  qrStatus: boolean
}

export const StatusCell = ({ isEvoEnabled, qrStatus }: StatusCellProps) => {
  let statusLabel = "Apagado"
  let statusIcon = <AlertTriangleIcon className="text-yellow-500 size-4 text-muted-foreground" />
  let tooltipText = "El robot está apagado o el QR está desconectado"

  if (!isEvoEnabled && qrStatus) {
    statusLabel = "Desconectado"
    statusIcon = <PowerOffIcon className="text-red-600 size-4 text-muted-foreground" />
    tooltipText = "El cliente no ha escaneado el código QR"
  } else if (isEvoEnabled && !qrStatus) {
    statusLabel = "Encendido"
    statusIcon = <CheckCircle2Icon className="text-green-600 dark:text-green-500 size-4 text-muted-foreground" />
    tooltipText = "Robot activo y QR escaneado correctamente"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="border-border gap-1 text-sm px-2 py-1">
            {statusIcon}
            {statusLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
