'use client';

import { useMemo, useState, useTransition } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CalendarDays, Layers, Paperclip, X, ExternalLink, FileText } from 'lucide-react';

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
    title: string; // ✅ Concepto
    description: string;
    reference: string;
};

type DraftAttachment = {
    id?: string; // si ya existe en DB
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

export default function MainExpenses({ userId, accounts, categories, currencies, expenses }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

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
        reference: '',
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
            reference: '',
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
            reference: row.reference ?? '',
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

    // ✅ subir a /api/upload-invoice
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

        startTransition(async () => {
            const payload = {
                userId,
                occurredAt: form.occurredAt,
                amount: form.amount,
                currencyCode: form.currencyCode,
                accountId: form.accountId,
                categoryId: form.categoryId,
                title: form.title || null,
                description: form.description || null,
                reference: form.reference || null,
            };

            const res = editing
                ? await updateExpense(editing.id, userId, payload)
                : await createExpense(payload);

            if (!res.success) {
                toast.error(res.message);
                return;
            }

            // ✅ id para adjuntar soportes
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

            toast.success(editing ? 'Gasto actualizado' : 'Gasto creado');
            setOpen(false);
            setEditing(null);
            setAttachments([]);
            router.refresh();
        });
    };

    const onDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteExpense(id, userId);

            if (!res.success) {
                toast.error(res.message);
                return;
            }

            toast.success('Gasto eliminado');
            router.refresh();

            // si justo estabas viendo ese detalle
            if (detailRow?.id === id) closeDetail();
        });
    };


    const columns = useMemo(
        () => buildExpenseColumns({ onEdit: openEdit, onDelete, busy: isPending }),
        [isPending] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const monthExpenses = useMemo(() => {
        const now = new Date();
        return expenses.filter((e: any) => isSameMonth(new Date(e.occurredAt), now));
    }, [expenses]);

    const totalExpenses = useMemo(() => expenses, [expenses]);

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
        <div className="space-y-4">
            <Card className="rounded-2xl">
                <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">Gastos</CardTitle>
                        <Button onClick={openCreate} disabled={isPending}>
                            Nuevo gasto
                        </Button>
                    </div>

                    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-2">
                        <TabsList className="h-10 w-full justify-start gap-6 rounded-none bg-transparent p-0">
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

                        <TabsContent value="month" className="mt-3">
                            <DataTable
                                columns={columns as any}
                                data={monthExpenses}
                                searchKey="title"
                                searchPlaceholder="Buscar en este mes..."
                                onRowClick={openDetail}
                            />
                        </TabsContent>

                        <TabsContent value="total" className="mt-3">
                            <DataTable
                                columns={columns as any}
                                data={totalExpenses}
                                searchKey="title"
                                searchPlaceholder="Buscar en todos..."
                                onRowClick={openDetail}
                            />
                        </TabsContent>
                    </Tabs>
                </CardHeader>

                <CardContent className="pt-0" />
            </Card>

            {/* ✅ Modal Detalle (click fila) */}
            <Dialog open={detailOpen} onOpenChange={(v) => (v ? setDetailOpen(true) : closeDetail())}>
                <DialogContent className="sm:max-w-[760px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base">Detalle del gasto</DialogTitle>
                    </DialogHeader>

                    {detailRow ? (
                        <div className="grid gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {detailRow.title || 'Sin concepto'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {toISODate(detailRow.occurredAt)} · {detailAccountName || '—'} · {detailCategoryName}
                                        </p>
                                        {detailRow.reference ? (
                                            <p className="text-xs text-muted-foreground">Ref: {detailRow.reference}</p>
                                        ) : null}
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {detailCurrency?.symbol ? `${detailCurrency.symbol} ` : ''}
                                            {String(detailRow.amount)}
                                            <span className="ml-2 text-xs text-muted-foreground">{detailRow.currencyCode}</span>
                                        </p>
                                    </div>
                                </div>

                                {detailRow.description ? (
                                    <div className="mt-2 rounded-md border bg-muted/20 p-3">
                                        <p className="text-xs whitespace-pre-wrap">{detailRow.description}</p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Soportes */}
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Recibos / Soportes</p>

                                {detailRow.attachments?.length ? (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {detailRow.attachments.map((a: any) => {
                                            const isImg = guessIsImage(a.mimeType, a.url);
                                            const isPdf = guessIsPdf(a.mimeType, a.url);

                                            return (
                                                <a
                                                    key={a.id}
                                                    href={a.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group overflow-hidden rounded-lg border"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Abrir"
                                                >
                                                    {isImg ? (
                                                        <div className="relative aspect-[4/3] w-full">
                                                            {/* usa <img> para no depender de next/image remote patterns */}
                                                            <img
                                                                src={a.url}
                                                                alt={a.fileName || 'soporte'}
                                                                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-3">
                                                            {isPdf ? (
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="truncate text-xs font-medium">
                                                                    {a.fileName || 'Archivo'}
                                                                </p>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    Abrir <ExternalLink className="ml-1 inline h-3 w-3" />
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-muted-foreground">Sin soportes</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        closeDetail();
                                        openEdit(detailRow);
                                    }}
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="destructive"
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

            {/* Modal Create/Edit */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[520px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base">
                            {editing ? 'Editar gasto' : 'Nuevo gasto'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Fecha</label>
                                <Input
                                    type="date"
                                    value={form.occurredAt}
                                    onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Monto</label>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={form.amount}
                                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                                    className="h-8 text-xs"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Cuenta</label>
                                <Select
                                    value={form.accountId}
                                    onValueChange={(v) => setForm((p) => ({ ...p, accountId: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a) => (
                                            <SelectItem key={a.id} value={a.id} className="text-xs">
                                                {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Moneda</label>
                                <Select
                                    value={form.currencyCode}
                                    onValueChange={(v) => setForm((p) => ({ ...p, currencyCode: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.code} value={c.code} className="text-xs">
                                                {c.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Categoría</label>
                            <Select
                                value={form.categoryId || '__none__'}
                                onValueChange={(v) =>
                                    setForm((p) => ({ ...p, categoryId: v === '__none__' ? null : v }))
                                }
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__" className="text-xs">
                                        Sin categoría
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id} className="text-xs">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ✅ Un solo campo: Concepto */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Concepto</label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                className="h-8 text-xs"
                                placeholder="Ej: Nómina / Publicidad / Servidor"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Referencia (opcional)</label>
                            <Input
                                value={form.reference}
                                onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                                className="h-8 text-xs"
                                placeholder="Ej: #Factura / #Recibo"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Descripción</label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                className="min-h-[90px] text-xs"
                                placeholder="Opcional"
                            />
                        </div>

                        {/* Adjuntar recibos / soportes */}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Recibos / Soportes</label>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 px-2 text-xs"
                                    disabled={uploading || isPending}
                                    onClick={() => document.getElementById('expense-receipts')?.click()}
                                >
                                    <Paperclip className="mr-2 h-4 w-4" />
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

                                {uploading ? (
                                    <span className="text-xs text-muted-foreground">Subiendo...</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        {attachments.length ? `${attachments.length} archivo(s)` : 'Sin archivos'}
                                    </span>
                                )}
                            </div>

                            {attachments.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {attachments.map((a, idx) => (
                                        <div
                                            key={a.id ?? `${a.url}-${idx}`}
                                            className="flex items-center gap-2 rounded-md border px-2 py-1"
                                        >
                                            <a
                                                href={a.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="max-w-[240px] truncate text-xs text-primary underline underline-offset-2"
                                            >
                                                {a.fileName || 'soporte'}
                                            </a>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                disabled={isPending}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        if (a.id) {
                                                            const res = await deleteExpenseAttachment({
                                                                userId,
                                                                attachmentId: a.id,
                                                            });

                                                            if (!res.success) {
                                                                toast.error(res.message);
                                                                return; // ✅ return void
                                                            }
                                                        }

                                                        setAttachments((prev) => prev.filter((_, i) => i !== idx));
                                                        toast.success('Soporte eliminado');
                                                        router.refresh();
                                                    });
                                                }}

                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button onClick={onSave} disabled={isPending || uploading}>
                                {editing ? 'Guardar cambios' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
