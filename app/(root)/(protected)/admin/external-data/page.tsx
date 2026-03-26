import AccessDenied from '@/app/AccessDenied';
import Header from '@/components/shared/header';
import { currentUser } from '@/lib/auth';
import { isAdminLike } from '@/lib/rbac';
import { ExternalDataImportClient } from './_components/ExternalDataImportClient';

export const dynamic = 'force-dynamic';

export default async function ExternalDataPage() {
  const user = await currentUser();

  if (!user || !isAdminLike(user.role)) {
    return <AccessDenied />;
  }

  return (
    <>
      <Header title="Datos Externos de Clientes" />
      <div className="p-4 md:p-6">
        <ExternalDataImportClient userId={user.id} />
      </div>
    </>
  );
}
