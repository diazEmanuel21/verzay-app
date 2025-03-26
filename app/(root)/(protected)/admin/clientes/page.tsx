// app/(protected)/admin/clientes/page.tsx

import { getAllUsers } from '@/actions/userClientDataActions';
import { ClientsManager } from './_components/clients-manager';

export default async function ClientesPage() {
  const users = await getAllUsers();

  return <ClientsManager users={users} />;
  
}
