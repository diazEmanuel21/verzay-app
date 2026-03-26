import AccessDenied from '@/app/AccessDenied';
import Header from '@/components/shared/header';
import { getEnrichedClients } from '@/actions/userClientDataActions';
import { currentUser } from '@/lib/auth';
import { isAdminLike, isAdminOrReseller } from '@/lib/rbac';
import { ExternalDataImportClient } from './_components/ExternalDataImportClient';

export const dynamic = 'force-dynamic';

export default async function ExternalDataPage() {
  const user = await currentUser();

  if (!user || !isAdminLike(user.role)) {
    return <AccessDenied />;
  }

  const resClients = isAdminOrReseller(user.role)
    ? await getEnrichedClients(user.role === 'reseller' ? { resellerId: user.id } : undefined)
    : { data: [] };

  const clients = (resClients?.data ?? []).map((c) => ({
    id: c.id,
    label: `${c.company ?? c.name ?? c.email}`,
    email: c.email,
  }));

  return (
    <>
      <Header title="Datos Externos de Clientes" />
      <div className="p-4 md:p-6">
        <ExternalDataImportClient clients={clients} />
      </div>
    </>
  );
}
