import { UserWithPausar } from "@/lib/types";
import { ClientsManager } from "./_components/clients-manager";
import { getAllUsers } from "@/actions/userClientDataActions";
import { obtenerApiKeys } from "@/actions/api-action";
import { ApiKey } from "@prisma/client";

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
  const apikeys = hasApikeys(resApikeys) ? resApikeys.data : [];

  if (!apikeys.length) {
    return <h1>No se encontraron apikeys.</h1>; 
  }

  return (
    <ClientsManager users={users} apikeys={apikeys} />
  )
}