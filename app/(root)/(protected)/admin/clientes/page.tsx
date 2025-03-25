// app/(protected)/admin/clientes/page.tsx

import { getAllUsers } from '@/actions/userClientDataActions';
import { ClientesPageClient } from './_components/clientes-client';

export default async function ClientesPage() {
  const users = await getAllUsers();

  return <ClientesPageClient users={users} />;
}
