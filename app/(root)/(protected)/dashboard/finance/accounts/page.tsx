import MainFinanceAccounts from './_components/MainFinanceAccounts';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getFinanceAccounts } from '@/actions/finance-accounts-actions';

// ✅ traer ventas y gastos para saldo + modal ledger
import { getAllSales } from '@/actions/finance-sales-actions';
import { getAllExpenses } from '@/actions/finance-expenses-actions';

export default async function FinanceAccountsPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  // ✅ IMPORTANTE: usar el ID real del usuario en BD (evita FK)
  const me = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me?.id) return null;

  // ✅ para monedas NO llames getSalesMeta (porque dispara ensureFinanceSalesDefaults)
  const currencies = await db.financeCurrency.findMany({ orderBy: { code: 'asc' } });

  const [accRes, salesRes, expensesRes] = await Promise.all([
    getFinanceAccounts(me.id),
    getAllSales(me.id),
    getAllExpenses(me.id),
  ]);

  const accounts = accRes.success ? accRes.data ?? [] : [];
  const sales = salesRes.success ? salesRes.data ?? [] : [];
  const expenses = expensesRes.success ? expensesRes.data ?? [] : [];

  return (
    <MainFinanceAccounts
      userId={me.id}
      initialAccounts={accounts}
      currencies={currencies}
      sales={sales}
      expenses={expenses}
    />
  );
}