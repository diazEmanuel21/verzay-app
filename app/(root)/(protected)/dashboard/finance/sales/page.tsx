import AccessDenied from "@/app/AccessDenied";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import MainSales from "./_components/MainSales";
import { getAllSales, getSalesMeta } from "@/actions/finance-sales-actions";
import { listProducts } from "@/actions/products-actions"; // ✅ agrega esto

export default async function SalesPage() {
  const user = await currentUser();
  if (!user?.id) return <AccessDenied />;

  const [metaRes, listRes, productsRes] = await Promise.all([
    getSalesMeta(user.id),
    getAllSales(user.id),
    listProducts({ userId: user.id, q: "", page: 1, perPage: 50, onlyActive: true }), // ✅ primer lote
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
      products={productsRes.items || []} // ✅ nuevo
    />
  );
}
