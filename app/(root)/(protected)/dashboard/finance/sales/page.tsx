import AccessDenied from "@/app/AccessDenied";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MainSales from "./_components/MainSales";
import { getAllSales, getSalesMeta } from "@/actions/finance-sales-actions";

export default async function SalesPage() {
  const user = await currentUser();
  if (!user?.id) return <AccessDenied />;

  const [metaRes, listRes] = await Promise.all([
    getSalesMeta(user.id),
    getAllSales(user.id),
  ]);

  if (!metaRes.success) return <div className="p-6 text-sm text-red-500">{metaRes.message}</div>;
  if (!listRes.success) return <div className="p-6 text-sm text-red-500">{listRes.message}</div>;

  return (
    <MainSales
      userId={user.id}
      accounts={metaRes.data!.accounts}
      categories={metaRes.data!.categories}
      currencies={metaRes.data!.currencies}
      sales={listRes.data || []}
    />
  );
}
