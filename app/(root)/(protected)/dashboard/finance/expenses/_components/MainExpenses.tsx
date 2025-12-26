'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { DataTable } from './data-table';
import { buildExpenseColumns } from './columns';

import {
  createExpense,
  updateExpense,
  deleteExpense,
  addExpenseAttachments,
  deleteExpenseAttachment,
} from '@/actions/finance-expenses-actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CalendarDays, Layers, Paperclip, X, ExternalLink, FileText } from 'lucide-react';
import { Loader2, Receipt, ImageIcon } from "lucide-react";


type Props = {
  userId: string;
  accounts: any[];
  categories: any[];
  currencies: any[];
  expenses: any[];
};

type FormState = {
  occurredAt: string;
  amount: string;
  currencyCode: string;
  accountId: string;
  categoryId: string | null;
  title: string;
  description: string;
};

type DraftAttachment = {
  id?: string;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  isNew?: boolean;
};

const toISODate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function isSameMonth(date: Date, base: Date) {
  return date.getFullYear() === base.getFullYear() && date.getMonth() === base.getMonth();
}

function guessIsImage(mimeType?: string | null, url?: string) {
  if (mimeType?.startsWith('image/')) return true;
  if (!url) return false;
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
}

function guessIsPdf(mimeType?: string | null, url?: string) {
  if (mimeType === 'application/pdf') return true;
  if (!url) return false;
  return /\.pdf$/i.test(url);
}

function toAmountNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  try {
    if (typeof v?.toNumber === 'function') {
      const n = v.toNumber();
      return Number.isFinite(n) ? n : 0;
    }
  } catch {}
  try {
    const n = Number(String(v));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export default function MainExpenses({ userId, accounts, categories, currencies, expenses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ✅ tabla sin recargar (estado local)
  const [rows, setRows] = useState<any[]>(expenses ?? []);
  useEffect(() => {
    setRows(expenses ?? []);
  }, [expenses]);

  // ✅ detalle por click en fila
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<any | null>(null);

  const openDetail = (row: any) => {
    setDetailRow(row);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailRow(null);
  };

  const [tab, setTab] = useState<'month' | 'total'>('month');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const defaultAccountId = useMemo(
    () => accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || '',
    [accounts]
  );

  const defaultCurrency = useMemo(
    () => currencies.find((c) => c.code === 'USD')?.code || currencies[0]?.code || 'USD',
    [currencies]
  );

  const [form, setForm] = useState<FormState>({
    occurredAt: toISODate(new Date()),
    amount: '',
    currencyCode: defaultCurrency,
    accountId: defaultAccountId,
    categoryId: null,
    title: '',
    description: '',
  });

  const resetForm = () => {
    setForm({
      occurredAt: toISODate(new Date()),
      amount: '',
      currencyCode: defaultCurrency,
      accountId: defaultAccountId,
      categoryId: null,
      title: '',
      description: '',
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setAttachments([]);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      occurredAt: toISODate(row.occurredAt),
      amount: String(row.amount),
      currencyCode: row.currencyCode,
      accountId: row.accountId,
      categoryId: row.categoryId ?? null,
      title: row.title ?? '',
      description: row.description ?? '',
    });

    setAttachments(
      (row.attachments || []).map((a: any) => ({
        id: a.id,
        url: a.url,
        fileName: a.fileName ?? null,
        mimeType: a.mimeType ?? null,
        sizeBytes: a.sizeBytes ?? null,
        isNew: false,
      }))
    );

    setOpen(true);
  };

  async function uploadReceipt(file: File) {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload-invoice', {
      method: 'POST',
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Error subiendo archivo');

    return {
      url: data.url as string,
      fileName: (data.fileName as string) ?? file.name,
      mimeType: (data.mimeType as string) ?? file.type,
      sizeBytes: (data.sizeBytes as number) ?? file.size,
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    try {
      const list = Array.from(files);
      for (const f of list) {
        const up = await uploadReceipt(f);
        setAttachments((prev) => [...prev, { ...up, isNew: true }]);
      }
      toast.success('Soporte(s) subido(s)');
    } catch (e: any) {
      toast.error(e?.message || 'Error al subir soporte');
    } finally {
      setUploading(false);
    }
  }

  const onSave = () => {
    if (!form.accountId) return toast.error('Selecciona una cuenta');
    if (!form.currencyCode) return toast.error('Selecciona una moneda');
    if (!form.amount) return toast.error('Ingresa un monto');
    if (!form.title.trim()) return toast.error('Ingresa el concepto');

    startTransition(() => {
      void (async () => {
        const payload = {
          userId,
          occurredAt: form.occurredAt,
          amount: form.amount,
          currencyCode: form.currencyCode,
          accountId: form.accountId,
          categoryId: form.categoryId,
          title: form.title.trim() || null,
          description: form.description?.trim() || null,
        };

        const res = editing
          ? await updateExpense(editing.id, userId, payload)
          : await createExpense(payload);

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        const txId = editing ? editing.id : (res as any).data?.id;

        const newOnes = attachments.filter((a) => a.isNew);
        if (txId && newOnes.length) {
          const attachRes = await addExpenseAttachments({
            userId,
            transactionId: txId,
            attachments: newOnes.map((a) => ({
              url: a.url,
              fileName: a.fileName ?? null,
              mimeType: a.mimeType ?? null,
              sizeBytes: a.sizeBytes ?? null,
            })),
          });

          if (!attachRes.success) {
            toast.error(attachRes.message);
            return;
          }
        }

        // ✅ actualizar UI sin recargar
        if (!editing && txId) {
          const nowIso = new Date().toISOString();
          setRows((prev) => [
            {
              id: txId,
              userId,
              type: 'EXPENSE',
              status: 'ACTIVE',
              occurredAt: new Date(payload.occurredAt).toISOString(),
              amount: payload.amount,
              currencyCode: payload.currencyCode,
              accountId: payload.accountId,
              categoryId: payload.categoryId,
              title: payload.title,
              description: payload.description,
              createdAt: nowIso,
              updatedAt: nowIso,
              deletedAt: null,
              account: accounts.find((a) => a.id === payload.accountId) || null,
              category: payload.categoryId ? categories.find((c) => c.id === payload.categoryId) || null : null,
              currency: currencies.find((c) => c.code === payload.currencyCode) || null,
              attachments: attachments.map((a) => ({
                id: a.id,
                url: a.url,
                fileName: a.fileName ?? null,
                mimeType: a.mimeType ?? null,
                sizeBytes: a.sizeBytes ?? null,
              })),
            },
            ...prev,
          ]);
        } else if (editing) {
          setRows((prev) =>
            prev.map((r) =>
              r.id !== editing.id
                ? r
                : {
                    ...r,
                    occurredAt: new Date(payload.occurredAt).toISOString(),
                    amount: payload.amount,
                    currencyCode: payload.currencyCode,
                    accountId: payload.accountId,
                    categoryId: payload.categoryId,
                    title: payload.title,
                    description: payload.description,
                    updatedAt: new Date().toISOString(),
                    account: accounts.find((a) => a.id === payload.accountId) || r.account,
                    category: payload.categoryId ? categories.find((c) => c.id === payload.categoryId) || null : null,
                    currency: currencies.find((c) => c.code === payload.currencyCode) || r.currency,
                    attachments: attachments.map((a) => ({
                      id: a.id,
                      url: a.url,
                      fileName: a.fileName ?? null,
                      mimeType: a.mimeType ?? null,
                      sizeBytes: a.sizeBytes ?? null,
                    })),
                  }
            )
          );
        }

        toast.success(editing ? 'Gasto actualizado' : 'Gasto creado');
        setOpen(false);
        setEditing(null);
        setAttachments([]);

        router.refresh(); // opcional, ya no dependes de esto
      })();
    });
  };

  const onDelete = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await deleteExpense(id, userId);
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success('Gasto eliminado');

        if (detailRow?.id === id) closeDetail();
        router.refresh();
      })();
    });
  };

  const columns = useMemo(
    () =>
      buildExpenseColumns({
        onEdit: openEdit,
        onDelete,
        busy: isPending,
      }),
    [isPending] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return rows.filter((e: any) => isSameMonth(new Date(e.occurredAt), now));
  }, [rows]);

  const totalExpenses = useMemo(() => rows, [rows]);

  // ✅ resumen compact (moneda principal = defaultCurrency)
  const primaryCurrencyCode = defaultCurrency;
  const currencyMeta = useMemo(
    () => currencies.find((c) => c.code === primaryCurrencyCode) || null,
    [currencies, primaryCurrencyCode]
  );

  const monthTotal = useMemo(() => {
    return monthExpenses
      .filter((e: any) => e.currencyCode === primaryCurrencyCode)
      .reduce((acc: number, e: any) => acc + toAmountNumber(e.amount), 0);
  }, [monthExpenses, primaryCurrencyCode]);

  const grandTotal = useMemo(() => {
    return totalExpenses
      .filter((e: any) => e.currencyCode === primaryCurrencyCode)
      .reduce((acc: number, e: any) => acc + toAmountNumber(e.amount), 0);
  }, [totalExpenses, primaryCurrencyCode]);

  const formatMoney = (value: number) => {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: primaryCurrencyCode,
        minimumFractionDigits: currencyMeta?.decimals ?? 2,
        maximumFractionDigits: currencyMeta?.decimals ?? 2,
      }).format(value);
    } catch {
      const decimals = currencyMeta?.decimals ?? 2;
      return `${currencyMeta?.symbol ? `${currencyMeta.symbol} ` : ''}${value.toFixed(decimals)} ${primaryCurrencyCode}`;
    }
  };

  // ✅ helpers detalle
  const detailAccountName = useMemo(() => {
    if (!detailRow?.accountId) return '';
    return accounts.find((a) => a.id === detailRow.accountId)?.name || '';
  }, [detailRow, accounts]);

  const detailCategoryName = useMemo(() => {
    if (!detailRow?.categoryId) return 'Sin categoría';
    return categories.find((c) => c.id === detailRow.categoryId)?.name || 'Sin categoría';
  }, [detailRow, categories]);

  const detailCurrency = useMemo(() => {
    if (!detailRow?.currencyCode) return null;
    return currencies.find((c) => c.code === detailRow.currencyCode) || null;
  }, [detailRow, currencies]);

  return (
    <div className="space-y-3">
      <Card className="rounded-2xl">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Gastos</CardTitle>
            <Button size="sm" onClick={openCreate} disabled={isPending}>
              Nuevo
            </Button>
          </div>

          {/* ✅ resumen ultra compacto con ícono */}
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-xs text-muted-foreground">Mes</p>
                <p className="text-sm font-semibold">{formatMoney(monthTotal)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{formatMoney(grandTotal)}</p>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
            <TabsList className="h-9 w-full justify-start gap-6 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="month"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Mes
              </TabsTrigger>
              <TabsTrigger
                value="total"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Total
              </TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-2">
              <DataTable
                columns={columns as any}
                data={monthExpenses}
                searchKey="title"
                searchPlaceholder="Buscar..."
                onRowClick={openDetail}
              />
            </TabsContent>

            <TabsContent value="total" className="mt-2">
              <DataTable
                columns={columns as any}
                data={totalExpenses}
                searchKey="title"
                searchPlaceholder="Buscar..."
                onRowClick={openDetail}
              />
            </TabsContent>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-0" />
      </Card>

      {/* ✅ Modal Detalle */}
      <Dialog open={detailOpen} onOpenChange={(v) => (v ? setDetailOpen(true) : closeDetail())}>
        <DialogContent className="sm:max-w-[760px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle del gasto</DialogTitle>
          </DialogHeader>

{detailRow ? (
  <div className="space-y-4">
    {/* Header resumen */}
    <div className="rounded-xl border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">
            {detailRow.title || 'Sin concepto'}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {toISODate(detailRow.occurredAt)}
            </span>

            <span className="inline-flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {detailAccountName || '—'}
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              {detailCategoryName}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">Monto</p>
          <p className="text-lg font-bold leading-tight">
            {detailCurrency?.symbol ? `${detailCurrency.symbol} ` : ''}
            {String(detailRow.amount)}
          </p>
          <p className="text-sm text-muted-foreground">{detailRow.currencyCode}</p>
        </div>
      </div>

      {/* Descripción */}
      {detailRow.description ? (
        <div className="mt-3 rounded-lg border bg-background p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {detailRow.description}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Sin descripción
        </p>
      )}
    </div>

    {/* Soportes */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Soportes</p>
        <p className="text-sm text-muted-foreground">
          {detailRow.attachments?.length ? `${detailRow.attachments.length} archivo(s)` : '0 archivos'}
        </p>
      </div>

      {detailRow.attachments?.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {detailRow.attachments.map((a: any) => {
            const isImg = guessIsImage(a.mimeType, a.url);
            const isPdf = guessIsPdf(a.mimeType, a.url);

            return (
              <a
                key={a.id ?? a.url}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                  {isImg ? (
                    <img
                      src={a.url}
                      alt={a.fileName || 'soporte'}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : isPdf ? (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.fileName || 'Archivo'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Abrir <ExternalLink className="ml-1 inline h-3 w-3" />
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Sin soportes</p>
        </div>
      )}
    </div>

    {/* Footer acciones */}
    <DialogFooter className="gap-2 sm:gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          closeDetail();
          openEdit(detailRow);
        }}
      >
        Editar
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(detailRow.id)}
        disabled={isPending}
      >
        Eliminar
      </Button>
    </DialogFooter>
  </div>
) : null}

        </DialogContent>
      </Dialog>

      {/* ✅ Modal Create/Edit */}
{/* Modal Create/Edit */}
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[560px] rounded-2xl p-0 overflow-hidden">
    {/* Header */}
    <div className="border-b bg-muted/10 px-6 py-4">
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          {editing ? "Editar gasto" : "Nuevo gasto"}
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          Registra un gasto con su soporte (imagen o PDF).
        </p>
      </DialogHeader>
    </div>

    {/* Body */}
    <div className="px-6 py-4 space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Fecha</label>
          <Input
            type="date"
            value={form.occurredAt}
            onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Monto</label>
          <Input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className="h-9 text-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Cuenta</label>
          <Select
            value={form.accountId}
            onValueChange={(v) => setForm((p) => ({ ...p, accountId: v }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-sm">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Moneda</label>
          <Select
            value={form.currencyCode}
            onValueChange={(v) => setForm((p) => ({ ...p, currencyCode: v }))}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-sm">
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categoría */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Categoría</label>
        <Select
          value={form.categoryId || "__none__"}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, categoryId: v === "__none__" ? null : v }))
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-sm">
              Sin categoría
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Concepto */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Concepto</label>
          <span className="text-xs text-muted-foreground">Obligatorio</span>
        </div>
        <Input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="h-9 text-sm"
          placeholder="Ej: Nómina / Publicidad / Servidor"
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="min-h-[110px] text-sm"
          placeholder="Opcional..."
        />
      </div>

      {/* Adjuntos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Soportes</label>
          <span className="text-sm text-muted-foreground">
            {attachments.length ? `${attachments.length} archivo(s)` : "0 archivos"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-3 text-sm"
            disabled={uploading || isPending}
            onClick={() => document.getElementById("expense-receipts")?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="mr-2 h-4 w-4" />
            )}
            Adjuntar
          </Button>

          <input
            id="expense-receipts"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            accept="image/*,application/pdf"
          />

          <p className="text-sm text-muted-foreground">
            {uploading ? "Subiendo..." : "Imágenes o PDF"}
          </p>
        </div>

        {attachments.length ? (
          <div className="grid gap-2">
            {attachments.map((a, idx) => {
              const isImg = guessIsImage(a.mimeType, a.url);
              const isPdf = guessIsPdf(a.mimeType, a.url);

              return (
                <div
                  key={a.id ?? `${a.url}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/10">
                      {isImg ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      ) : isPdf ? (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-primary underline underline-offset-2"
                      >
                        {a.fileName || "soporte"}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {a.isNew ? "Nuevo (pendiente de guardar)" : "Guardado"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(() => {
                        (async () => {
                          if (a.id) {
                            const res = await deleteExpenseAttachment({
                              userId,
                              attachmentId: a.id,
                            });

                            if (!res.success) {
                              toast.error(res.message);
                              return;
                            }
                          }

                          setAttachments((prev) => prev.filter((_, i) => i !== idx));
                          toast.success("Soporte eliminado");
                          router.refresh();
                        })();
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Aún no has adjuntado soportes.</p>
          </div>
        )}
      </div>
    </div>

    {/* Footer */}
    <div className="border-t bg-muted/10 px-6 py-3 flex justify-end gap-2">
      <Button variant="outline" className="h-9 text-sm" onClick={() => setOpen(false)} disabled={isPending}>
        Cancelar
      </Button>
      <Button className="h-9 text-sm" onClick={onSave} disabled={isPending || uploading}>
        {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}
