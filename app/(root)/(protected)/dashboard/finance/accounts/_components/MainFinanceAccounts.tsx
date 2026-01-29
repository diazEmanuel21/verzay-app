'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DataTable } from '../../sales/_components/data-table'; // ajusta si cambia ruta
import { buildAccountsColumns } from './columns';

import {
  createFinanceAccount,
  deleteFinanceAccount,
  updateFinanceAccount,
} from '@/actions/finance-accounts-actions';

import {
  Plus,
  Wallet,
  Coins,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';

type Props = {
  userId: string;
  initialAccounts: any[];
  currencies: any[];

  // ✅ nuevo: para saldo y modal
  sales: any[];
  expenses: any[];
};

type FormState = {
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  currencyCode: string;
  isDefault: boolean;
};

const toISODate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function toAmountNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

// ✅ ventas total = amount + extra - discount
function calcSaleTotal(row: any) {
  const base = toAmountNumber(row?.amount);
  const extra = toAmountNumber(row?.extra);
  const disc = toAmountNumber(row?.discount);
  return base + extra - disc;
}

function formatMoney(currencies: any[], code: string, value: number) {
  const meta = currencies.find((c) => c.code === code);
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

export default function MainFinanceAccounts({
  userId,
  initialAccounts,
  currencies,
  sales,
  expenses,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<any[]>(initialAccounts ?? []);
  useEffect(() => setRows(initialAccounts ?? []), [initialAccounts]);

  const defaultCurrencyCode = useMemo(() => {
    return currencies?.find((c) => c.code === 'USD')?.code || currencies?.[0]?.code || 'USD';
  }, [currencies]);

  // -------------------------
  // ✅ Modal ledger por cuenta
  // -------------------------
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState<any | null>(null);
  const [ledgerTab, setLedgerTab] = useState<'all' | 'sales' | 'expenses'>('all');

  const openLedger = (accountRow: any) => {
    setLedgerAccount(accountRow);
    setLedgerTab('all');
    setLedgerOpen(true);
  };

  const closeLedger = () => {
    setLedgerOpen(false);
    setLedgerAccount(null);
  };

  // -------------------------
  // ✅ CRUD modal (crear/editar)
  // -------------------------
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'PERSONAL',
    currencyCode: defaultCurrencyCode,
    isDefault: false,
  });

  useEffect(() => {
    setForm((p) => ({
      ...p,
      currencyCode: p.currencyCode || defaultCurrencyCode,
    }));
  }, [defaultCurrencyCode]);

  const resetForm = () => {
    setForm({
      name: '',
      type: 'PERSONAL',
      currencyCode: defaultCurrencyCode,
      isDefault: false,
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      type: (row.type ?? 'PERSONAL') as any,
      currencyCode: row.currencyCode ?? defaultCurrencyCode,
      isDefault: !!row.isDefault,
    });
    setOpen(true);
  };

  const onSave = () => {
    if (!form.name.trim()) return toast.error('Ingresa un nombre de cuenta');
    if (!form.currencyCode) return toast.error('Selecciona una moneda');

    startTransition(() => {
      void (async () => {
        const payload = {
          userId,
          name: form.name.trim(),
          type: form.type,
          currencyCode: form.currencyCode,
          isDefault: form.isDefault,
        };

        const res = editing
          ? await updateFinanceAccount(editing.id, userId, payload)
          : await createFinanceAccount(payload);

        if (!res.success) return toast.error(res.message);

        toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
        setOpen(false);
        setEditing(null);
        router.refresh();
      })();
    });
  };

  const onDelete = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await deleteFinanceAccount(id, userId);
        if (!res.success) return toast.error(res.message);

        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success('Cuenta eliminada');
        router.refresh();
      })();
    });
  };

  const onSetDefault = (row: any) => {
    startTransition(() => {
      void (async () => {
        const res = await updateFinanceAccount(row.id, userId, { isDefault: true });
        if (!res.success) return toast.error(res.message);

        toast.success('Cuenta por defecto actualizada');
        router.refresh();
      })();
    });
  };

  // -----------------------------------------
  // ✅ Resumen por cuenta (ventas/gastos/saldo)
  // -----------------------------------------
  const summaryByAccount = useMemo(() => {
    const map = new Map<
      string,
      {
        currencyCode: string;
        sales: number;
        expenses: number;
        balance: number;
      }
    >();

    for (const acc of rows) {
      map.set(acc.id, {
        currencyCode: acc.currencyCode || defaultCurrencyCode,
        sales: 0,
        expenses: 0,
        balance: 0,
      });
    }

    for (const s of sales || []) {
      const id = s.accountId;
      if (!id || !map.has(id)) continue;
      const cur = map.get(id)!;
      cur.sales += calcSaleTotal(s);
    }

    for (const e of expenses || []) {
      const id = e.accountId;
      if (!id || !map.has(id)) continue;
      const cur = map.get(id)!;
      cur.expenses += toAmountNumber(e?.amount);
    }

    map.forEach((v) => {
  v.balance = v.sales - v.expenses;
});

    return map;
  }, [rows, sales, expenses, defaultCurrencyCode]);

  const getAccountSummary = (accountId: string) => {
    const s = summaryByAccount.get(accountId);
    if (!s) return { salesText: '—', expensesText: '—', balanceText: '—' };

    const code = s.currencyCode || defaultCurrencyCode;
    return {
      salesText: formatMoney(currencies, code, s.sales),
      expensesText: formatMoney(currencies, code, s.expenses),
      balanceText: formatMoney(currencies, code, s.balance),
    };
  };

  const columns = useMemo(
    () =>
      buildAccountsColumns({
        onEdit: openEdit,
        onDelete,
        onSetDefault,
        busy: isPending,
        getAccountSummary,
      }),
    [isPending, rows, sales, expenses, currencies] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // -----------------------------------------
  // ✅ Ledger data (ventas + gastos) por cuenta
  // -----------------------------------------
  const ledgerRows = useMemo(() => {
    if (!ledgerAccount?.id) return [];

    const accountId = ledgerAccount.id;

    const salesRows =
      (sales || [])
        .filter((s) => s.accountId === accountId)
        .map((s) => ({
          id: `S-${s.id}`,
          kind: 'SALE' as const,
          occurredAt: s.occurredAt,
          title: s.title || 'Venta',
          amount: calcSaleTotal(s),
          currencyCode: s.currencyCode || ledgerAccount.currencyCode,
          raw: s,
        })) || [];

    const expenseRows =
      (expenses || [])
        .filter((e) => e.accountId === accountId)
        .map((e) => ({
          id: `E-${e.id}`,
          kind: 'EXPENSE' as const,
          occurredAt: e.occurredAt,
          title: e.title || 'Gasto',
          amount: toAmountNumber(e.amount),
          currencyCode: e.currencyCode || ledgerAccount.currencyCode,
          raw: e,
        })) || [];

    const all = [...salesRows, ...expenseRows].sort((a, b) => {
      const da = new Date(a.occurredAt).getTime();
      const db = new Date(b.occurredAt).getTime();
      return db - da;
    });

    if (ledgerTab === 'sales') return all.filter((r) => r.kind === 'SALE');
    if (ledgerTab === 'expenses') return all.filter((r) => r.kind === 'EXPENSE');
    return all;
  }, [ledgerAccount, sales, expenses, ledgerTab]);

  const ledgerTotals = useMemo(() => {
    if (!ledgerAccount?.id) return { sales: 0, expenses: 0, balance: 0 };

    const id = ledgerAccount.id;

    const s = (sales || [])
      .filter((x) => x.accountId === id)
      .reduce((acc, x) => acc + calcSaleTotal(x), 0);

    const e = (expenses || [])
      .filter((x) => x.accountId === id)
      .reduce((acc, x) => acc + toAmountNumber(x.amount), 0);

    return { sales: s, expenses: e, balance: s - e };
  }, [ledgerAccount, sales, expenses]);

  const ledgerCurrencyCode = ledgerAccount?.currencyCode || defaultCurrencyCode;

  // ✅ columnas para el modal ledger (simple, sin tu DataTable genérico)
  const ledgerColumns = useMemo(() => {
    return [
      {
        accessorKey: 'occurredAt',
        header: 'Fecha',
        cell: ({ row }: any) => (
          <span className="text-sm">{toISODate(row.original.occurredAt)}</span>
        ),
      },
      {
        accessorKey: 'kind',
        header: 'Tipo',
        cell: ({ row }: any) => {
          const k = row.original.kind;
          return (
            <span className="inline-flex items-center gap-2 text-sm">
              {k === 'SALE' ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> Venta
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-muted-foreground" /> Gasto
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Concepto',
        cell: ({ row }: any) => (
          <span className="truncate text-sm font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Monto',
        cell: ({ row }: any) => {
          const r = row.original;
          return (
            <div className="text-right">
              <p className="text-sm font-semibold">
                {formatMoney(currencies, r.currencyCode || ledgerCurrencyCode, r.amount)}
              </p>
              <p className="text-[11px] text-muted-foreground">{r.currencyCode}</p>
            </div>
          );
        },
      },
    ];
  }, [currencies, ledgerCurrencyCode]);

  return (
    <div className="space-y-3">
      <Card className="border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Cuentas</CardTitle>
              <Badge variant="secondary" className="h-6 text-[11px]">
                {rows.length} cuentas
              </Badge>
            </div>

            <Button size="sm" onClick={openCreate} disabled={isPending} className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Nueva cuenta
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            columns={columns as any}
            data={rows}
            searchKey="name"
            searchPlaceholder="Buscar cuenta..."
            onRowClick={openLedger} // ✅ click abre modal ledger
          />
        </CardContent>
      </Card>

      {/* ✅ MODAL LEDGER (ventas + gastos por cuenta) */}
      <Dialog open={ledgerOpen} onOpenChange={(v) => (v ? setLedgerOpen(true) : closeLedger())}>
        <DialogContent className="sm:max-w-[980px] rounded-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              Movimientos de la cuenta: {ledgerAccount?.name || '—'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Ventas, gastos y saldo (ventas - gastos) de esta cuenta.
            </p>
          </DialogHeader>

          {/* Totales arriba */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Total</p>
                  <p className="text-sm font-medium">Ventas</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">
                  {formatMoney(currencies, ledgerCurrencyCode, ledgerTotals.sales)}
                </p>
                <p className="text-[11px] text-muted-foreground">{ledgerCurrencyCode}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Total</p>
                  <p className="text-sm font-medium">Gastos</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">
                  {formatMoney(currencies, ledgerCurrencyCode, ledgerTotals.expenses)}
                </p>
                <p className="text-[11px] text-muted-foreground">{ledgerCurrencyCode}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Cuenta</p>
                  <p className="text-sm font-medium">Saldo</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">
                  {formatMoney(currencies, ledgerCurrencyCode, ledgerTotals.balance)}
                </p>
                <p className="text-[11px] text-muted-foreground">Ventas - Gastos</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs value={ledgerTab} onValueChange={(v) => setLedgerTab(v as any)}>
            <TabsList className="h-9 w-full justify-start gap-6 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Todos
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="sales"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Ventas
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="expenses"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Gastos
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-2">
              <DataTable
                columns={ledgerColumns as any}
                data={ledgerRows}
                searchKey="title"
                searchPlaceholder="Buscar concepto..."
              />
            </TabsContent>

            <TabsContent value="sales" className="mt-2">
              <DataTable
                columns={ledgerColumns as any}
                data={ledgerRows}
                searchKey="title"
                searchPlaceholder="Buscar concepto..."
              />
            </TabsContent>

            <TabsContent value="expenses" className="mt-2">
              <DataTable
                columns={ledgerColumns as any}
                data={ledgerRows}
                searchKey="title"
                searchPlaceholder="Buscar concepto..."
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL CREATE/EDIT */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[680px] rounded-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">{editing ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
            <p className="text-xs text-muted-foreground">Define el nombre, tipo y moneda base de la cuenta.</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Nombre */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Nombre</p>
                </div>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Ej: Caja principal"
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Tipo</p>
                </div>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as any }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL" className="text-sm">
                      Personal
                    </SelectItem>
                    <SelectItem value="COMPANY" className="text-sm">
                      Empresa
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Moneda de la cuenta</p>
                </div>

                <Select value={form.currencyCode} onValueChange={(v) => setForm((p) => ({ ...p, currencyCode: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-sm">
                        {c.code} {c.symbol ? `· ${c.symbol}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  Recomendado: la moneda se usa por defecto al crear ventas/gastos con esta cuenta.
                </p>
              </div>

              <Separator className="sm:col-span-2" />

              {/* Default */}
              <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2 sm:col-span-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Cuenta por defecto</p>
                  <p className="text-xs text-muted-foreground">Se selecciona automáticamente al crear una venta o gasto.</p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isDefault: v }))}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending} className="h-9">
                Cancelar
              </Button>
              <Button onClick={onSave} size="sm" disabled={isPending} className="h-9">
                {editing ? 'Guardar cambios' : 'Crear cuenta'}
              </Button>
            </div>

            {editing && !editing.isDefault ? (
              <>
                <Separator />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => onSetDefault(editing)}
                >
                  Marcar como cuenta por defecto
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
