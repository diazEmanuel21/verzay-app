"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

export const StatusCell = ({ isEvoEnabled }: { isEvoEnabled: boolean }) => {
  return (
    <Badge
      variant="outline"
      className="flex gap-1 px-1.5 [&_svg]:size-3"
    >
      {isEvoEnabled ?
        <>
          <CheckCircle2Icon className="text-green-600 dark:text-green-500" />
          Activo
        </> :
        <>
          <XCircleIcon className="text-red-600" />
          Inactivo
        </>
        // <>
        //   <Loader2Icon className="animate-spin text-yellow-500" />
        //   Cargando...
      }
    </Badge>
  )
}
