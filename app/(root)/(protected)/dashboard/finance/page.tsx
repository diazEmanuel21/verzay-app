import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { db } from '@/lib/db';
import { auth } from '@/auth';

import { CalendarDays, TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';
import { FinanceMonthChart } from './_components/FinanceMonthChart';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

function toAmountNumber(v: any): number {
  const n = Number(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

function calcTotal(row: { amount?: any; extra?: any; discount?: any }) {
  const base = toAmountNumber(row.amount);
  const extra = toAmountNumber(row.extra);
  const disc = toAmountNumber(row.discount);
  return base + extra - disc;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function keyYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatPlain(n: number) {
  // ✅ sin moneda, solo número (combinado)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n);
}

function moneyFormat(meta: { code: string; symbol: string; decimals: number } | undefined, value: number) {
  const code = meta?.code ?? 'USD';
  const decimals = typeof meta?.decimals === 'number' ? meta.decimals : 2;

  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    const symbol = meta?.symbol ? `${meta.symbol} ` : '';
    return `${symbol}${value.toFixed(decimals)} ${code}`;
  }
}

export default async function FinanceHomePage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const me = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me?.id) return null;

  const now = new Date();
  const from = startOfMonth(now);
  const to = startOfNextMonth(now);

  const currencies = await db.financeCurrency.findMany({
    orderBy: { code: 'asc' },
    select: { code: true, symbol: true, decimals: true },
  });

  const monthTx = await db.financeTransaction.findMany({
    where: {
      userId: me.id,
      status: { not: 'DELETED' as any },
      occurredAt: { gte: from, lt: to },
      type: { in: ['SALE', 'EXPENSE'] as any },
    },
    select: {
      type: true,
      currencyCode: true,
      occurredAt: true,
      amount: true,
      extra: true,
      discount: true,
    },
    orderBy: { occurredAt: 'asc' },
  });

  // ✅ Totales combinados (mezclando monedas tal cual)
  let salesCombined = 0;
  let expensesCombined = 0;

  // ✅ (Opcional) breakdown por moneda (para mostrar chips)
  const salesByCurrency = new Map<string, number>();
  const expensesByCurrency = new Map<string, number>();

  for (const r of monthTx) {
    const total = calcTotal(r);
    const code = r.currencyCode || '—';

    if (r.type === 'SALE') {
      salesCombined += total;
      salesByCurrency.set(code, (salesByCurrency.get(code) || 0) + total);
    }
    if (r.type === 'EXPENSE') {
      expensesCombined += total;
      expensesByCurrency.set(code, (expensesByCurrency.get(code) || 0) + total);
    }
  }

  // ✅ Series por día (combinada también)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayRows = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return { day: i + 1, key: keyYMD(d), sales: 0, expenses: 0 };
  });

  const dayIndex = new Map<string, number>();
  dayRows.forEach((r, idx) => dayIndex.set(r.key, idx));

  for (const r of monthTx) {
    const k = keyYMD(new Date(r.occurredAt));
    const idx = dayIndex.get(k);
    if (idx === undefined) continue;

    const total = calcTotal(r);
    if (r.type === 'SALE') dayRows[idx].sales += total;
    if (r.type === 'EXPENSE') dayRows[idx].expenses += total;
  }

  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const salesBreakdown =
    salesByCurrency.size === 0
      ? []
      : Array.from(salesByCurrency.entries()).map(([code, v]) => {
          const meta = currencies.find((c) => c.code === code);
          return { code, label: moneyFormat(meta, v) };
        });

  const expensesBreakdown =
    expensesByCurrency.size === 0
      ? []
      : Array.from(expensesByCurrency.entries()).map(([code, v]) => {
          const meta = currencies.find((c) => c.code === code);
          return { code, label: moneyFormat(meta, v) };
        });

  return (
    <div className="space-y-3">
      {/* ✅ Resumen mes (COMBINADO) */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Ventas</p>
                  <CardTitle className="text-sm">Total del mes</CardTitle>
                </div>
              </div>

              <Badge variant="secondary" className="h-6 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {monthLabel}
                </span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* ✅ Total combinado sin moneda */}
            <p className="text-lg font-bold leading-tight">{formatPlain(salesCombined)}</p>

            {/* ✅ breakdown por moneda (opcional) */}
            {salesBreakdown.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {salesBreakdown.map((b) => (
                  <Badge key={b.code} variant="outline" className="h-6 text-[11px]">
                    {b.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Gastos</p>
                  <CardTitle className="text-sm">Total del mes</CardTitle>
                </div>
              </div>

              <Badge variant="secondary" className="h-6 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {monthLabel}
                </span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* ✅ Total combinado sin moneda */}
            <p className="text-lg font-bold leading-tight">{formatPlain(expensesCombined)}</p>

            {/* ✅ breakdown por moneda (opcional) */}
            {expensesBreakdown.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {expensesBreakdown.map((b) => (
                  <Badge key={b.code} variant="outline" className="h-6 text-[11px]">
                    {b.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ✅ Accesos (azules) */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="leading-tight">
                <CardTitle className="text-sm">Ventas</CardTitle>
                <p className="text-[11px] text-muted-foreground">Registra y revisa ventas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="h-9 w-full">
              <Link href="/dashboard/finance/sales">
                Ir a Ventas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="leading-tight">
                <CardTitle className="text-sm">Gastos</CardTitle>
                <p className="text-[11px] text-muted-foreground">Registra y revisa gastos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="h-9 w-full">
              <Link href="/dashboard/finance/expenses">
                Ir a Gastos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="leading-tight">
                <CardTitle className="text-sm">Cuentas</CardTitle>
                <p className="text-[11px] text-muted-foreground">Administra cuentas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="h-9 w-full">
              <Link href="/dashboard/finance/accounts">
                Ir a Cuentas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Diagrama del mes (COMBINADO) */}
      <Card className="border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="leading-tight">
              <CardTitle className="text-sm">Ventas vs Gastos por día</CardTitle>
              <p className="text-[11px] text-muted-foreground">{monthLabel}</p>
            </div>
            <Badge variant="outline" className="h-6 text-[11px]">
              {daysInMonth} días
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <FinanceMonthChart data={dayRows.map((r) => ({ day: r.day, sales: r.sales, expenses: r.expenses }))} />
        </CardContent>
      </Card>
    </div>
  );
}
