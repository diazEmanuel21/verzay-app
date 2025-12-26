import AccessDenied from "@/app/AccessDenied";
import { currentUser } from "@/lib/auth";
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getAllExpenses, getExpensesMeta } from "@/actions/finance-expenses-actions";
import MainExpenses from "./_components/MainExpenses";

export default async function ExpensesPage() {

    
  const user = await currentUser();
  if (!user?.id) return <AccessDenied />;

  const [metaRes, listRes] = await Promise.all([
    getExpensesMeta(user.id),
    getAllExpenses(user.id),
  ]);

  if (!metaRes.success) return <div className="p-6 text-sm text-red-500">{metaRes.message}</div>;
  if (!listRes.success) return <div className="p-6 text-sm text-red-500">{listRes.message}</div>;

  return (
    <MainExpenses
      userId={user.id}
      accounts={metaRes.data!.accounts}
      categories={metaRes.data!.categories}
      currencies={metaRes.data!.currencies}
      expenses={listRes.data || []}
    />

    
  );
}
