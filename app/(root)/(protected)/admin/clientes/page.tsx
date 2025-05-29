import { ClientInterface } from "@/lib/types"
import { ClientsManager } from "./_components/clients-manager"
import { getAllUsers, getAllClients, getClientsByResellerId, getUsersByResellerId } from "@/actions/userClientDataActions"
import { obtenerApiKeys } from "@/actions/api-action"
import { ApiKey } from "@prisma/client"
import { currentUser } from "@/lib/auth"

function hasUsers(result: { data?: ClientInterface[] }): result is { data: ClientInterface[] } {
  return !!result.data
}

function hasApikeys(result: { data?: ApiKey[] }): result is { data: ApiKey[] } {
  return !!result.data
}

export default async function ClientesPage() {
  const user = await currentUser()

  if (!user) {
    return <h1>No autorizado.</h1>
  }

  // 🔁 Obtener usuarios según el rol
  let resUsers
  if (user.role === "reseller") {
    resUsers = await getClientsByResellerId(user.id) // <- función que debes crear
  } else {
    resUsers = await getAllClients()
  }

  const users = hasUsers(resUsers) ? resUsers.data : []

  if (!users.length) {
    return <h1>No se encontraron usuarios.</h1>
  }

  const resApikeys = await obtenerApiKeys()
  const allApikeys = hasApikeys(resApikeys) ? resApikeys.data : []

  if (!allApikeys.length) {
    return <h1>No se encontraron apikeys.</h1>
  }

  // 📊 Contar cuántos usuarios usan cada apiKeyId
  const apiKeyUsageCount: Record<string, number> = {}

  users.forEach(user => {
    const keyId = user.apiKeyId
    if (keyId) {
      apiKeyUsageCount[keyId] = (apiKeyUsageCount[keyId] || 0) + 1
    }
  })

  //Limita la candidad de usuarios que pueden asignar api por el rendimientos de servidor
  // se habilito esta opcion
  const availableApikeys = allApikeys.filter(apiKey => {
    const usage = apiKeyUsageCount[apiKey.id] || 0
    return usage < 100
  })

  return <ClientsManager users={users} apikeys={allApikeys} availableApikeys={availableApikeys} currentUserRol={user.role} />
}
