"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PowerIcon, QrCodeIcon } from "lucide-react"
import { Button } from "./ui/button"

interface StatusCellProps {
  isEvoEnabled?: boolean
  qrStatus?: boolean
}
1
export const StatusCell = ({ qrStatus, isEvoEnabled }: StatusCellProps) => {
  const qrColor = qrStatus ? "text-red-600" : "text-green-600"
  const evoColor = isEvoEnabled ? "text-green-600" : "text-red-600"

  const qrTooltip = qrStatus
    ? "QR desconectado"
    : "QR conectado"

  const evoTooltip = isEvoEnabled
    ? "Robot encendido"
    : "Robot apagado"

  return (
    <>
      {
        qrStatus !== undefined &&
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"outline"}>
              <QrCodeIcon className={`${qrColor} size-5`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{qrTooltip}</TooltipContent>
        </Tooltip>
      }

      {
        isEvoEnabled !== undefined &&
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={"outline"}>
              <PowerIcon className={`${evoColor} size-5`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{evoTooltip}</TooltipContent>
        </Tooltip>
      }
    </>
  )
}
