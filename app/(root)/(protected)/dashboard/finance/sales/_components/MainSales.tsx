'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { DataTable } from './data-table';
import { buildSalesColumns } from './columns';

import {
  createSale,
  updateSale,
  deleteSale,
  addSaleAttachments,
  deleteSaleAttachment,
} from '@/actions/finance-sales-actions';

import { listProducts } from '@/actions/products-actions';

//  usamos tus actions existentes
import { searchSessionsByUserId } from '@/actions/session-action';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

import {
  CalendarDays,
  Layers,
  Paperclip,
  X,
  ExternalLink,
  FileText,
  Receipt,
  ChevronsUpDown,
  Check,
  UserRound,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
  userId: string;
  accounts: any[];
  categories: any[];
  currencies: any[];
  sales: any[];
  products: any[];
  sessions: any[]; //  nuevo
};

type FormState = {
  occurredAt: string;
  amount: string;      // base
  extra: string;       // suma
  discount: string;    // resta
  currencyCode: string;
  accountId: string;
  categoryId: string | null;
  title: string;
  description: string;

  productId: string | null;

  //  NUEVO: contacto Session
  sessionId: number | null;
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
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

function calcTotal(row: { amount?: any; extra?: any; discount?: any }) {
  const base = toAmountNumber(row.amount);
  const extra = toAmountNumber(row.extra);
  const disc = toAmountNumber(row.discount);
  return base + extra - disc;
}

function sumByCurrency(list: any[]) {
  return list.reduce<Record<string, number>>((acc, r) => {
    const code = r.currencyCode || '—';
    const total = calcTotal(r);
    acc[code] = (acc[code] || 0) + total;
    return acc;
  }, {});
}

// helper para pintar label del contacto
function sessionLabel(s: any) {
  const name = s?.pushName?.trim();
  const jid = s?.remoteJid?.trim();
  if (name && jid) return `${name} (${jid})`;
  return name || jid || `Session #${s?.id ?? ''}`;
}

export default function MainSales({ userId, accounts, categories, currencies, sales, products, sessions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  //  tabla sin recargar
  const [rows, setRows] = useState<any[]>(sales ?? []);
  useEffect(() => setRows(sales ?? []), [sales]);

  //  detalle por click fila
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

  //  selector buscable productos
  const [productOpen, setProductOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>(products ?? []);
  useEffect(() => setProductOptions(products ?? []), [products]);

  useEffect(() => {
    if (!productOpen) return;

    const t = setTimeout(() => {
      void (async () => {
        setProductLoading(true);
        try {
          const res = await listProducts({
            userId,
            q: productQuery.trim(),
            page: 1,
            perPage: 30,
            onlyActive: true,
          });
          setProductOptions(res.items || []);
        } catch (e: any) {
          toast.error(e?.message || 'Error buscando productos');
        } finally {
          setProductLoading(false);
        }
      })();
    }, 300);

    return () => clearTimeout(t);
  }, [productOpen, productQuery, userId]);

  //  selector buscable contactos (Session)
  const [contactOpen, setContactOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactOptions, setContactOptions] = useState<any[]>(sessions ?? []);
  useEffect(() => setContactOptions(sessions ?? []), [sessions]);

  useEffect(() => {
    if (!contactOpen) return;

    const t = setTimeout(() => {
      void (async () => {
        setContactLoading(true);
        try {
          const res = await searchSessionsByUserId(userId, contactQuery.trim());
          if (!res.success) {
            toast.error(res.message || 'Error buscando contactos');
            setContactOptions([]);
          } else {
            setContactOptions(res.data || []);
          }
        } catch (e: any) {
          toast.error(e?.message || 'Error buscando contactos');
        } finally {
          setContactLoading(false);
        }
      })();
    }, 300);

    return () => clearTimeout(t);
  }, [contactOpen, contactQuery, userId]);

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
    extra: '',
    discount: '',
    currencyCode: defaultCurrency,
    accountId: defaultAccountId,
    categoryId: null,
    title: '',
    description: '',
    productId: null,
    sessionId: null, //  nuevo
  });

  const resetForm = () => {
    setForm({
      occurredAt: toISODate(new Date()),
      amount: '',
      extra: '',
      discount: '',
      currencyCode: defaultCurrency,
      accountId: defaultAccountId,
      categoryId: null,
      title: '',
      description: '',
      productId: null,
      sessionId: null, //  nuevo
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setAttachments([]);
    setProductQuery('');
    setContactQuery('');
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);

    const inferredProductId =
      row.productId ?? products.find((p) => p.title === row.title)?.id ?? null;

    setForm({
      occurredAt: toISODate(row.occurredAt),
      amount: String(row.amount ?? ''),
      extra: String(row.extra ?? ''),
      discount: String(row.discount ?? ''),
      currencyCode: row.currencyCode,
      accountId: row.accountId,
      categoryId: row.categoryId ?? null,
      title: row.title ?? '',
      description: row.description ?? '',
      productId: inferredProductId,

      //  nuevo
      sessionId: typeof row.sessionId === 'number' ? row.sessionId : (row.sessionId ? Number(row.sessionId) : null),
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

  //  subir a /api/upload-invoice
  async function uploadReceipt(file: File) {
    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch('/api/upload-invoice', { method: 'POST', body: fd });
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
      for (const f of Array.from(files)) {
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
    if (!form.productId) return toast.error('Selecciona un producto');
    if (!form.amount) return toast.error('Ingresa un monto');

    startTransition(() => {
      void (async () => {
        const payload = {
          userId,
          occurredAt: form.occurredAt,
          amount: form.amount,
          extra: form.extra?.trim() ? form.extra : '0',
          discount: form.discount?.trim() ? form.discount : '0',
          currencyCode: form.currencyCode,
          accountId: form.accountId,
          categoryId: form.categoryId,
          title: form.title?.trim() || null,
          description: form.description?.trim() || null,
          productId: form.productId,

          //  NUEVO: vincular contacto
          sessionId: form.sessionId ?? null,
        };

        const res = editing
          ? await updateSale(editing.id, userId, payload)
          : await createSale(payload);

        if (!res.success) return toast.error(res.message);

        const txId = editing ? editing.id : (res as any).data?.id;

        const newOnes = attachments.filter((a) => a.isNew);
        if (txId && newOnes.length) {
          const attachRes = await addSaleAttachments({
            userId,
            transactionId: txId,
            attachments: newOnes.map((a) => ({
              url: a.url,
              fileName: a.fileName ?? null,
              mimeType: a.mimeType ?? null,
              sizeBytes: a.sizeBytes ?? null,
            })),
          });
          if (!attachRes.success) return toast.error(attachRes.message);
        }

        //  UI instantánea
        const nowIso = new Date().toISOString();
        if (!editing && txId) {
          const selectedSession =
            form.sessionId != null ? (contactOptions.find((s) => s.id === form.sessionId) ?? null) : null;

          setRows((prev) => [
            {
              id: txId,
              userId,
              type: 'SALE',
              status: 'ACTIVE',
              occurredAt: new Date(payload.occurredAt).toISOString(),
              amount: payload.amount,
              extra: payload.extra,
              discount: payload.discount,
              currencyCode: payload.currencyCode,
              accountId: payload.accountId,
              categoryId: payload.categoryId,
              title: payload.title,
              description: payload.description,
              productId: payload.productId,

              //  nuevo
              sessionId: payload.sessionId,
              session: selectedSession,

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
          const selectedSession =
            form.sessionId != null ? (contactOptions.find((s) => s.id === form.sessionId) ?? null) : null;

          setRows((prev) =>
            prev.map((r) =>
              r.id !== editing.id
                ? r
                : {
                    ...r,
                    occurredAt: new Date(payload.occurredAt).toISOString(),
                    amount: payload.amount,
                    extra: payload.extra,
                    discount: payload.discount,
                    currencyCode: payload.currencyCode,
                    accountId: payload.accountId,
                    categoryId: payload.categoryId,
                    title: payload.title,
                    description: payload.description,
                    productId: payload.productId,

                    //  nuevo
                    sessionId: payload.sessionId,
                    session: selectedSession,

                    updatedAt: nowIso,
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

        toast.success(editing ? 'Venta actualizada' : 'Venta creada');
        setOpen(false);
        setEditing(null);
        setAttachments([]);

        router.refresh();
      })();
    });
  };

  const onDelete = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await deleteSale(id, userId);
        if (!res.success) return toast.error(res.message);

        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success('Venta eliminada');
        if (detailRow?.id === id) closeDetail();

        router.refresh();
      })();
    });
  };

  const columns = useMemo(
    () => buildSalesColumns({ onEdit: openEdit, onDelete, busy: isPending }),
    [isPending] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const monthRows = useMemo(() => {
    const now = new Date();
    return rows.filter((r) => isSameMonth(new Date(r.occurredAt), now));
  }, [rows]);

  const totalsMonth = useMemo(() => sumByCurrency(monthRows), [monthRows]);
  const totalsAll = useMemo(() => sumByCurrency(rows), [rows]);

  const formatMoney = (value: number, code: string) => {
    const meta = currencies.find((c) => c.code === code);
    const decimals = typeof meta?.decimals === 'number' ? meta.decimals : 2;
    const symbol = meta?.symbol ? `${meta.symbol} ` : '';
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch {
      return `${symbol}${value.toFixed(decimals)} ${code}`;
    }
  };

  const monthTotalText = useMemo(() => {
    const entries = Object.entries(totalsMonth);
    if (!entries.length) return '—';
    return entries.map(([code, v]) => `${formatMoney(v, code)}`).join(' • ');
  }, [totalsMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const grandTotalText = useMemo(() => {
    const entries = Object.entries(totalsAll);
    if (!entries.length) return '—';
    return entries.map(([code, v]) => `${formatMoney(v, code)}`).join(' • ');
  }, [totalsAll]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const detailBase = useMemo(() => toAmountNumber(detailRow?.amount), [detailRow]);
  const detailExtra = useMemo(() => toAmountNumber(detailRow?.extra), [detailRow]);
  const detailDiscount = useMemo(() => toAmountNumber(detailRow?.discount), [detailRow]);
  const detailTotal = useMemo(() => detailBase + detailExtra - detailDiscount, [detailBase, detailExtra, detailDiscount]);

  const detailSessionLabel = useMemo(() => {
    const s = detailRow?.session;
    if (s) return sessionLabel(s);
    // fallback si no incluyes session en getAllSales
    if (detailRow?.sessionId) return `Session #${detailRow.sessionId}`;
    return 'Sin contacto';
  }, [detailRow]);

  return (
    <div className="space-y-3">
      <Card className="border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Ventas</CardTitle>
            <Button size="sm" onClick={openCreate} disabled={isPending}>
              Nuevo
            </Button>
          </div>

          {/*  resumen */}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2 hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-muted-foreground">Total mes</p>
                  <p className="text-sm font-medium">Resumen</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="text-sm font-semibold">{monthTotalText}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2 hover:bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-medium">Acumulado</p>
                </div>
              </div>
              <div className="text-right leading-tight">
                <p className="text-xs text-muted-foreground">Monto</p>
                <p className="text-sm font-semibold">{grandTotalText}</p>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
            <TabsList className="h-9 w-full justify-start gap-6 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="month"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Mes
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="total"
                className="rounded-none border-b-2 border-transparent px-0 text-sm data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <span className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Total
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-2">
              <DataTable
                columns={columns as any}
                data={monthRows}
                searchKey="title"
                searchPlaceholder="Buscar..."
                onRowClick={openDetail}
              />
            </TabsContent>

            <TabsContent value="total" className="mt-2">
              <DataTable
                columns={columns as any}
                data={rows}
                searchKey="title"
                searchPlaceholder="Buscar..."
                onRowClick={openDetail}
              />
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0" />
      </Card>

      {/*  Modal Detalle */}
      <Dialog open={detailOpen} onOpenChange={(v) => (v ? setDetailOpen(true) : closeDetail())}>
        <DialogContent className="sm:max-w-[760px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle de venta</DialogTitle>
          </DialogHeader>

          {detailRow ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{detailRow.title || 'Sin concepto'}</p>

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

                      {/*  contacto */}
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {detailSessionLabel}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold leading-tight">
                      {detailCurrency?.symbol ? `${detailCurrency.symbol} ` : ''}
                      {String(detailTotal)}
                    </p>
                    <p className="text-sm text-muted-foreground">{detailRow.currencyCode}</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Base: {String(detailBase)} · Extra: {String(detailExtra)} · Desc: {String(detailDiscount)}
                    </p>
                  </div>
                </div>

                {detailRow.description ? (
                  <div className="mt-3 rounded-lg border bg-background p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{detailRow.description}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Sin descripción</p>
                )}
              </div>

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
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-background">
                            {isImg ? (
                              <img src={a.url} alt={a.fileName || 'soporte'} className="h-10 w-10 object-cover" />
                            ) : isPdf ? (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Paperclip className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.fileName || 'Archivo'}</p>
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
                <Button variant="destructive" size="sm" onClick={() => onDelete(detailRow.id)} disabled={isPending}>
                  Eliminar
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/*  Modal Create/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[760px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? '🧾 Editar venta' : '🧾 Nueva venta'}</DialogTitle>
          </DialogHeader>

          {(() => {
            const previewAccountName = accounts.find((a) => a.id === form.accountId)?.name || '—';
            const previewCategoryName = form.categoryId
              ? categories.find((c) => c.id === form.categoryId)?.name || 'Sin categoría'
              : 'Sin categoría';
            const previewCurrency = currencies.find((c) => c.code === form.currencyCode) || null;

            const base = toAmountNumber(form.amount);
            const extra = toAmountNumber(form.extra);
            const disc = toAmountNumber(form.discount);
            const total = base + extra - disc;

            const decimals = typeof previewCurrency?.decimals === 'number' ? previewCurrency.decimals : 2;
            const totalFormatted = new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }).format(total);

            const mini = (n: number) =>
              new Intl.NumberFormat('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

            const selectedSession =
              form.sessionId != null ? (contactOptions.find((s) => s.id === form.sessionId) ?? null) : null;

            return (
              <div className="space-y-4">
                {/* Preview */}
                <div className="rounded-xl border bg-muted/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {form.title?.trim() ? form.title.trim() : 'Sin concepto'}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {form.occurredAt}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          {previewAccountName}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                          {previewCategoryName}
                        </span>

                        {/*  contacto en preview */}
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          {selectedSession ? sessionLabel(selectedSession) : 'Sin contacto'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold leading-tight">
                        {previewCurrency?.symbol ? `${previewCurrency.symbol} ` : ''}
                        {totalFormatted}
                      </p>
                      <p className="text-sm text-muted-foreground">{form.currencyCode}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Base: {mini(base)} · Extra: {mini(extra)} · Desc: {mini(disc)}
                      </p>
                    </div>
                  </div>

                  {form.description?.trim() ? (
                    <div className="mt-3 rounded-lg border bg-background p-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{form.description.trim()}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">-</p>
                  )}
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Fecha</label>
                        <Input
                          type="date"
                          value={form.occurredAt}
                          onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Monto (base)</label>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Extra</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={form.extra}
                          onChange={(e) => setForm((p) => ({ ...p, extra: e.target.value }))}
                          className="h-9 text-sm"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Descuento</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={form.discount}
                          onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
                          className="h-9 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Cuenta</label>
                        <Select value={form.accountId} onValueChange={(v) => setForm((p) => ({ ...p, accountId: v }))}>
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
                        <label className="text-sm text-muted-foreground">Moneda</label>
                        <Select value={form.currencyCode} onValueChange={(v) => setForm((p) => ({ ...p, currencyCode: v }))}>
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

                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">Categoría</label>
                      <Select
                        value={form.categoryId || '__none__'}
                        onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v === '__none__' ? null : v }))}
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

                    {/*  Contacto buscable (Session) */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">Contacto</label>

                      <Popover open={contactOpen} onOpenChange={setContactOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="h-9 w-full justify-between text-sm"
                            disabled={isPending}
                          >
                            <span className="truncate">
                              {form.sessionId != null
                                ? (() => {
                                    const s = contactOptions.find((x) => x.id === form.sessionId);
                                    return s ? sessionLabel(s) : `Session #${form.sessionId}`;
                                  })()
                                : 'Selecciona un contacto'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar contacto..."
                              value={contactQuery}
                              onValueChange={setContactQuery}
                            />

                            <CommandEmpty>
                              {contactLoading ? 'Buscando...' : 'Sin resultados.'}
                            </CommandEmpty>

                            <CommandGroup>
                              {/* opción limpiar */}
                              <CommandItem
                                value="__none__"
                                onSelect={() => {
                                  setForm((prev) => ({ ...prev, sessionId: null }));
                                  setContactOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', form.sessionId == null ? 'opacity-100' : 'opacity-0')} />
                                <span className="flex-1 truncate">Sin contacto</span>
                              </CommandItem>

                              {contactOptions.map((s) => {
                                const selected = form.sessionId === s.id;
                                const label = sessionLabel(s);

                                return (
                                  <CommandItem
                                    key={s.id}
                                    value={label}
                                    onSelect={() => {
                                      setForm((prev) => ({ ...prev, sessionId: s.id }));
                                      setContactOpen(false);
                                    }}
                                  >
                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                    <span className="flex-1 truncate">{label}</span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <p className="text-xs text-muted-foreground">
                        Vincula la venta a un contacto del CRM (Session).
                      </p>
                    </div>

                    {/*  Producto buscable */}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">Producto</label>

                      <Popover open={productOpen} onOpenChange={setProductOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="h-9 w-full justify-between text-sm"
                            disabled={isPending}
                          >
                            <span className="truncate">
                              {form.productId
                                ? (productOptions.find((p) => p.id === form.productId)?.title || form.title || 'Producto')
                                : 'Selecciona un producto'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar producto..."
                              value={productQuery}
                              onValueChange={setProductQuery}
                            />

                            <CommandEmpty>
                              {productLoading ? 'Buscando...' : 'Sin resultados.'}
                            </CommandEmpty>

                            <CommandGroup>
                              {productOptions.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.title}
                                  onSelect={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      productId: p.id,
                                      title: p.title,
                                      amount: String(p.price ?? 0),
                                    }));
                                    setProductOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      form.productId === p.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="flex-1 truncate">{p.title}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">{String(p.price ?? 0)}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">Descripción</label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        className="min-h-[64px] h-[64px] resize-y text-sm"
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">Soportes</label>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 px-3 text-sm"
                          disabled={uploading || isPending}
                          onClick={() => document.getElementById('sale-receipts')?.click()}
                        >
                          <Paperclip className="mr-2 h-4 w-4" />
                          Adjuntar
                        </Button>

                        <input
                          id="sale-receipts"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                          accept="image/*,application/pdf"
                        />
                      </div>

                      {attachments.length ? (
                        <div className="grid grid-cols-1 gap-2">
                          {attachments.map((a, idx) => (
                            <div
                              key={a.id ?? `${a.url}-${idx}`}
                              className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30"
                            >
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-background">
                                {guessIsImage(a.mimeType, a.url) ? (
                                  <img src={a.url} alt={a.fileName || 'soporte'} className="h-10 w-10 object-cover" />
                                ) : guessIsPdf(a.mimeType, a.url) ? (
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <Receipt className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-sm font-medium text-primary underline underline-offset-2"
                                >
                                  {a.fileName || 'Archivo'}
                                </a>
                                <p className="text-xs text-muted-foreground">{a.isNew ? 'Nuevo (sin guardar)' : 'Guardado'}</p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                disabled={isPending}
                                onClick={() => {
                                  startTransition(() => {
                                    void (async () => {
                                      if (a.id) {
                                        const res = await deleteSaleAttachment({ userId, attachmentId: a.id });
                                        if (!res.success) return toast.error(res.message);
                                      }
                                      setAttachments((prev) => prev.filter((_, i) => i !== idx));
                                      toast.success('Soporte eliminado');
                                      router.refresh();
                                    })();
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border p-4">
                          <p className="text-sm text-muted-foreground">{uploading ? 'Subiendo...' : 'Sin soportes'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button onClick={onSave} size="sm" disabled={isPending || uploading}>
                    {editing ? 'Guardar cambios' : 'Guardar'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
