import { UserWithPausar } from "@/lib/types"
import { ClientsManager } from "./_components/clients-manager"
import { getAllUsers } from "@/actions/userClientDataActions"
import { obtenerApiKeys } from "@/actions/api-action"
import { ApiKey } from "@prisma/client"

function hasUsers(result: { data?: UserWithPausar[] }): result is { data: UserWithPausar[] } {
  return !!result.data;
}

function hasApikeys(result: { data?: ApiKey[] }): result is { data: ApiKey[] } {
  return !!result.data;
}

export default async function ClientesPage() {
  const resUsers = await getAllUsers();
  const users = hasUsers(resUsers) ? resUsers.data : [];

  if (!users.length) {
    return <h1>No se encontraron usuarios.</h1>;
  }

  const resApikeys = await obtenerApiKeys();
  const allApikeys = hasApikeys(resApikeys) ? resApikeys.data : [];

  if (!allApikeys.length) {
    return <h1>No se encontraron apikeys.</h1>;
  }

  // 🧠 Contar cuántos usuarios usan cada apiKeyId
  const apiKeyUsageCount: Record<string, number> = {};

  users.forEach(user => {
    const keyId = user.apiKeyId;
    if (keyId) {
      apiKeyUsageCount[keyId] = (apiKeyUsageCount[keyId] || 0) + 1;
    }
  });

  // ✅ Filtrar apikeys que tengan 10 o menos usuarios
  const availableApikeys = allApikeys.filter(apiKey => {
    const usage = apiKeyUsageCount[apiKey.id] || 0;
    return usage < 10;
  });

  return (
    <ClientsManager users={users} apikeys={allApikeys} availableApikeys={availableApikeys}/>
  );
}
