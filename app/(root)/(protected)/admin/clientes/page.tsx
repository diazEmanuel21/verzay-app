import { UserWithPausar } from "@/lib/types";
import { ClientsManager } from "./_components/clients-manager";
import { getAllUsers } from "@/actions/userClientDataActions";

function hasUsers(result: { data?: UserWithPausar[] }): result is { data: UserWithPausar[] } {
  return !!result.data;
}

export default async function ClientesPage() {
  const result = await getAllUsers();
  return hasUsers(result)
    ? <ClientsManager users={result.data} />
    : <h1>Error cargando usuarios</h1>;
}