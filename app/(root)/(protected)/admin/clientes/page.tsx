import { ClientsManager } from "./_components/clients-manager";
import { getClientsPageData } from "./helpers/getClientsPageData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientesPage() {
  const res = await getClientsPageData();

  if (!res.success) return <h1>{res.message}</h1>;

  const { users, apikeys, availableApikeys, currentUserRol, countries } = res.data;

  return (
    <ClientsManager
      users={users}
      apikeys={apikeys}
      availableApikeys={availableApikeys}
      currentUserRol={currentUserRol}
      countries={countries}
    />
  );
}
