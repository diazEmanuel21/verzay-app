"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react"
import { getDataApi } from "@/actions/api-action"

interface StatusCellProps {
  userId: string
  instanceId: string
}

interface dataApi {
  apiKeyId: string
  url: string
  key: string
  instanceName: string
  instanceId: string
}

export const StatusCell: React.FC<StatusCellProps> = ({
  userId,
  instanceId,
}) => {

  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [dataApi, setDataApi] = useState<dataApi | null>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const getApi = await getDataApi(userId, instanceId)
        console.log("DATA:", getApi.data)

        if (!getApi || !getApi.data) return

        setDataApi(getApi.data)
      } catch {
        setIsEnabled(false)
      }
    }

    fetchInitialData()
  }, [userId, instanceId])

  useEffect(() => {
    if (!dataApi) return

    const fetchStatus = async () => {
      try {
        console.log("Si hay datos", dataApi)

        const response = await fetch(`https://${dataApi.url}/webhook/find/${dataApi.instanceName}`, {
          method: "GET",
          headers: {
            apikey: dataApi.key,
          },
        })

        const result = await response.json()
        setIsEnabled(result?.enabled ?? false)
      } catch {
        setIsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [dataApi])

  return (
    <Badge
      variant="outline"
      className="flex gap-1 px-1.5 [&_svg]:size-3"
    >
      {loading ? (
        <>
          <Loader2Icon className="animate-spin text-yellow-500" />
          Cargando...
        </>
      ) : isEnabled ? (
        <>
          <CheckCircle2Icon className="text-green-600 dark:text-green-500" />
          Activo
        </>
      ) : (
        <>
          <XCircleIcon className="text-red-600" />
          Inactivo
        </>
      )}
    </Badge>
  )
}
