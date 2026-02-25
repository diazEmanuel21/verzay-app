// app/(root)/(protected)/admin/ruta-para-listar-clientes-y-crm-pagos/ui/BillingCrmClient.tsx
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";



import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "lucide-react";

import {
    activateUserService,
    getUserBillingByUserId,
    markUserAsPaid,
    markUserAsUnpaid,
    setUserBillingDueDate,
    suspendUserService,
    upsertUserBillingConfig,
} from "@/actions/billing/billing-actions";
import { ResponseFormat } from "@/types/billing";

// ------- Types (mantenerlo simple para no tocar tus types existentes)
type BillingStatus = "PAID" | "UNPAID";
type AccessStatus = "ACTIVE" | "SUSPENDED";

type UserBilling = {
    id: string;
    userId: string;
    price: string | null;
    currencyCode: string;
    paymentMethodLabel: string | null;
    paymentNotes: string | null;
    dueDate: string | Date | null;
    billingStatus: BillingStatus;
    accessStatus: AccessStatus;
    suspendedAt: string | Date | null;
    suspendedReason: string | null;
    lastPaymentAt: string | Date | null;
    lastReminderAt: string | Date | null;
    lastReminderDueDate: string | Date | null;
    graceDays: number;
};

type ClientRow = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    company: string;
    notificationNumber: string;
    plan: string;
    createdAt: string | Date;
    billing?: UserBilling | null;
};

function safeDate(d?: string | Date | null) {
    if (!d) return null;
    const dd = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dd.getTime())) return null;
    return dd;
}

function fmtDateShort(d?: string | Date | null) {
    const dd = safeDate(d);
    if (!dd) return "—";
    return format(dd, "yyyy-MM-dd");
}

function money(price?: string | null, code?: string) {
    if (!price) return "—";
    return `${price} ${code ?? ""}`.trim();
}

function statusBadgePaid(status?: BillingStatus) {
    if (status === "PAID") return <Badge className="text-xs">Pagó</Badge>;
    return (
        <Badge variant="secondary" className="text-xs">
            No pagó
        </Badge>
    );
}

function statusBadgeAccess(status?: AccessStatus) {
    if (status === "ACTIVE") return <Badge className="text-xs">Activo</Badge>;
    return (
        <Badge variant="destructive" className="text-xs">
            Suspendido
        </Badge>
    );
}

// ------- Dialog state
type EditDialogState = {
    open: boolean;
    user?: ClientRow | null;
    loading?: boolean;
    form: {
        dueDate: string; // yyyy-mm-dd
        price: string;
        currencyCode: string;
        paymentMethodLabel: string;
        paymentNotes: string;
        graceDays: string;
    };
};

const emptyDialog: EditDialogState = {
    open: false,
    user: null,
    loading: false,
    form: {
        dueDate: "",
        price: "",
        currencyCode: "COP",
        paymentMethodLabel: "",
        paymentNotes: "",
        graceDays: "0",
    },
};

export function BillingCrmClient({
    initial,
}: {
    initial: ResponseFormat<ClientRow[]>;
}) {
    const [data, setData] = useState<ClientRow[]>(initial.data ?? []);
    const [q, setQ] = useState("");
    const [dialog, setDialog] = useState<EditDialogState>(emptyDialog);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return data;

        return data.filter((u) => {
            const a =
                `${u.name ?? ""} ${u.email} ${u.company ?? ""} ${u.plan ?? ""}`
                    .toLowerCase()
                    .includes(term);
            return a;
        });
    }, [data, q]);

    async function refreshBillingForUser(userId: string) {
        const res = await getUserBillingByUserId(userId);
        if (!res.success) {
            toast.error(res.message);
            return;
        }

        setData((prev) =>
            prev.map((u) =>
                u.id === userId ? { ...u, billing: res.data ?? null } : u
            )
        );
    }

    async function handleMarkPaid(userId: string) {
        const res = await markUserAsPaid(userId);
        if (!res.success) return toast.error(res.message);
        toast.success(res.message);
        await refreshBillingForUser(userId);
    }

    async function handleMarkUnpaid(userId: string) {
        const res = await markUserAsUnpaid(userId);
        if (!res.success) return toast.error(res.message);
        toast.success(res.message);
        await refreshBillingForUser(userId);
    }

    async function handleSuspend(userId: string) {
        const res = await suspendUserService(userId, "Vencido sin pago");
        if (!res.success) return toast.error(res.message);
        toast.success(res.message);
        await refreshBillingForUser(userId);
    }

    async function handleActivate(userId: string) {
        const res = await activateUserService(userId);
        if (!res.success) return toast.error(res.message);
        toast.success(res.message);
        await refreshBillingForUser(userId);
    }

    async function openEdit(u: ClientRow) {
        setDialog((s) => ({ ...s, open: true, user: u, loading: true }));

        // traer billing real para poblar dialog (por si la lista estaba desfasada)
        const res = await getUserBillingByUserId(u.id);
        if (!res.success) {
            toast.error(res.message);
            setDialog((s) => ({ ...s, loading: false }));
            return;
        }

        const b: UserBilling | null = res.data ?? null;

        setDialog({
            open: true,
            user: u,
            loading: false,
            form: {
                dueDate: b?.dueDate ? fmtDateShort(b.dueDate) : "",
                price: b?.price ?? "",
                currencyCode: b?.currencyCode ?? "COP",
                paymentMethodLabel: b?.paymentMethodLabel ?? "",
                paymentNotes: b?.paymentNotes ?? "",
                graceDays: String(b?.graceDays ?? 0),
            },
        });
    }

    async function saveEdit() {
        const u = dialog.user;
        if (!u) return;

        try {
            setDialog((s) => ({ ...s, loading: true }));

            // 1) config
            const cfg = await upsertUserBillingConfig({
                userId: u.id,
                price: dialog.form.price || null,
                currencyCode: dialog.form.currencyCode || "COP",
                paymentMethodLabel: dialog.form.paymentMethodLabel || null,
                paymentNotes: dialog.form.paymentNotes || null,
                graceDays: Number(dialog.form.graceDays || 0),
            });

            if (!cfg.success) {
                toast.error(cfg.message);
                setDialog((s) => ({ ...s, loading: false }));
                return;
            }

            // 2) due date (solo si viene)
            const due = dialog.form.dueDate?.trim() ? dialog.form.dueDate : null;
            const dueRes = await setUserBillingDueDate(u.id, due);

            if (!dueRes.success) {
                toast.error(dueRes.message);
                setDialog((s) => ({ ...s, loading: false }));
                return;
            }

            toast.success("Pagos actualizados.");
            await refreshBillingForUser(u.id);

            setDialog(emptyDialog);
        } catch (e: any) {
            console.error("[saveEdit]", e);
            toast.error("Error guardando cambios.");
            setDialog((s) => ({ ...s, loading: false }));
        }
    }

    return (
        <Card className="rounded-2xl border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">CRM Pagos</CardTitle>
                <CardDescription className="text-sm">
                    Gestiona vencimientos, pagos y acceso al servicio.
                </CardDescription>

                <div className="mt-3 flex gap-2">
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre, email, empresa, plan…"
                        className="h-9 text-sm"
                    />
                </div>
            </CardHeader>

            <CardContent className="pt-0 border-border">
                <div className="rounded-xl border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border">
                                <TableHead className="text-xs">Cliente</TableHead>
                                <TableHead className="text-xs">Precio</TableHead>
                                <TableHead className="text-xs">Medio</TableHead>
                                <TableHead className="text-xs">Vence</TableHead>
                                <TableHead className="text-xs">Pago</TableHead>
                                <TableHead className="text-xs">Acceso</TableHead>
                                <TableHead className="text-xs text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.map((u) => {
                                const b = u.billing ?? null;

                                return (
                                    <TableRow key={u.id} className="h-10  border-border">
                                        <TableCell className="py-2">
                                            <div className="leading-tight">
                                                <div className="text-sm font-medium truncate max-w-[260px]">
                                                    {u.name ?? "Sin nombre"}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                                                    {u.email}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 text-xs">
                                            {money(b?.price ?? null, b?.currencyCode ?? "COP")}
                                        </TableCell>

                                        <TableCell className="py-2 text-xs truncate max-w-[180px]">
                                            {b?.paymentMethodLabel ?? "—"}
                                        </TableCell>

                                        <TableCell className="py-2 text-xs">
                                            {fmtDateShort(b?.dueDate ?? null)}
                                        </TableCell>

                                        <TableCell className="py-2 text-xs">
                                            {statusBadgePaid(b?.billingStatus ?? "UNPAID")}
                                        </TableCell>

                                        <TableCell className="py-2 text-xs">
                                            {statusBadgeAccess(b?.accessStatus ?? "ACTIVE")}
                                        </TableCell>

                                        <TableCell className="py-2 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Ellipsis className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel className="text-xs">
                                                        Acciones
                                                    </DropdownMenuLabel>

                                                    <DropdownMenuItem
                                                        className="text-xs"
                                                        onClick={() => openEdit(u)}
                                                    >
                                                        Editar pagos
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        className="text-xs"
                                                        onClick={() => handleMarkPaid(u.id)}
                                                    >
                                                        Marcar pagó
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        className="text-xs"
                                                        onClick={() => handleMarkUnpaid(u.id)}
                                                    >
                                                        Marcar no pagó
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        className="text-xs"
                                                        onClick={() => handleSuspend(u.id)}
                                                    >
                                                        Suspender servicio
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        className="text-xs"
                                                        onClick={() => handleActivate(u.id)}
                                                    >
                                                        Activar servicio
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {!filtered.length && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm">
                                        No hay resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Dialog editar */}
                <Dialog
                    open={dialog.open}
                    onOpenChange={(open) =>
                        setDialog((s) => (open ? s : emptyDialog))
                    }
                >
                    <DialogContent className="sm:max-w-[520px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base">Editar pagos</DialogTitle>
                            <DialogDescription className="text-sm">
                                Configura precio, medio y fecha de vencimiento.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3">
                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Fecha de pago (vence)
                                </label>
                                <Input
                                    type="date"
                                    value={dialog.form.dueDate}
                                    onChange={(e) =>
                                        setDialog((s) => ({
                                            ...s,
                                            form: { ...s.form, dueDate: e.target.value },
                                        }))
                                    }
                                    className="h-9 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1">
                                    <label className="text-xs text-muted-foreground">Precio</label>
                                    <Input
                                        value={dialog.form.price}
                                        onChange={(e) =>
                                            setDialog((s) => ({
                                                ...s,
                                                form: { ...s.form, price: e.target.value },
                                            }))
                                        }
                                        placeholder="Ej: 129000"
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-xs text-muted-foreground">Moneda</label>
                                    <Input
                                        value={dialog.form.currencyCode}
                                        onChange={(e) =>
                                            setDialog((s) => ({
                                                ...s,
                                                form: { ...s.form, currencyCode: e.target.value },
                                            }))
                                        }
                                        placeholder="COP"
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Medio de pago
                                </label>
                                <Input
                                    value={dialog.form.paymentMethodLabel}
                                    onChange={(e) =>
                                        setDialog((s) => ({
                                            ...s,
                                            form: { ...s.form, paymentMethodLabel: e.target.value },
                                        }))
                                    }
                                    placeholder="Ej: Transferencia / Nequi / Stripe"
                                    className="h-9 text-sm"
                                />
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Instrucciones / notas
                                </label>
                                <Input
                                    value={dialog.form.paymentNotes}
                                    onChange={(e) =>
                                        setDialog((s) => ({
                                            ...s,
                                            form: { ...s.form, paymentNotes: e.target.value },
                                        }))
                                    }
                                    placeholder="Ej: Cuenta, link, referencia, etc."
                                    className="h-9 text-sm"
                                />
                            </div>

                            <div className="grid gap-1">
                                <label className="text-xs text-muted-foreground">
                                    Días de gracia
                                </label>
                                <Input
                                    value={dialog.form.graceDays}
                                    onChange={(e) =>
                                        setDialog((s) => ({
                                            ...s,
                                            form: { ...s.form, graceDays: e.target.value },
                                        }))
                                    }
                                    placeholder="0"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDialog(emptyDialog)}
                                disabled={!!dialog.loading}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={saveEdit} disabled={!!dialog.loading}>
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}