// app/(root)/(protected)/admin/ruta-para-listar-clientes-y-crm-pagos/ui/BillingCrmClient.tsx
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ClientRow, EditDialogState, emptyDialog, ResponseFormat, UserBilling } from "@/types/billing";
import { fmtDateShort, money } from "@/actions/billing/helpers/billing-helpers";
import { daysLeftService, StatusBadgeAccess, StatusBadgePaid } from "../helpers";

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
                serviceName: b?.serviceName ?? "",
                notifyRemoteJid: b?.notifyRemoteJid ?? "",
                serviceStartAt: b?.serviceStartAt ? fmtDateShort(b.serviceStartAt) : "",
                serviceEndsAt: b?.serviceEndsAt ? fmtDateShort(b.serviceEndsAt) : "",
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
                serviceName: dialog.form.serviceName || null,
                notifyRemoteJid: dialog.form.notifyRemoteJid || null,
                serviceStartAt: dialog.form.serviceStartAt || null,
                serviceEndsAt: dialog.form.serviceEndsAt || null,
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
        <Card className="border-border">
            <CardHeader>
                <CardTitle>CRM Pagos</CardTitle>
                <CardDescription>
                    Gestiona vencimientos, pagos y acceso al servicio.
                </CardDescription>

                <div className="mt-3 flex gap-2">
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por nombre, email, empresa, plan…"
                        className="h-9"
                    />
                </div>
            </CardHeader>

            <CardContent className="border-border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border">
                            <TableHead>Servicio</TableHead>
                            <TableHead>Notificación</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Vence</TableHead>
                            {/* <TableHead>Fin ciclo</TableHead> */}
                            <TableHead>Días restantes</TableHead>

                            <TableHead>Cliente</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Medio</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Acceso</TableHead>

                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filtered.map((u) => {
                            const b = u.billing ?? null;

                            return (
                                <TableRow key={u.id} className="h-10  border-border">
                                    <TableCell className="py-2 text-xs">{b?.serviceName ?? "—"}</TableCell>
                                    <TableCell className="py-2 text-xs truncate max-w-[160px]">
                                        {b?.notifyRemoteJid ?? u.notificationNumber ?? "—"}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs">{fmtDateShort(b?.serviceStartAt ?? null)}</TableCell>
                                    <TableCell className="py-2">
                                        {fmtDateShort(b?.dueDate ?? null)}
                                    </TableCell>
                                    {/* <TableCell className="py-2 text-xs">{fmtDateShort(b?.serviceEndsAt ?? null)}</TableCell> */}
                                    <TableCell className="py-2 text-xs">{daysLeftService(b?.dueDate ?? null)}</TableCell>

                                    <TableCell className="py-2">
                                        <div className="leading-tight">
                                            <div className="font-medium truncate max-w-[260px]">
                                                {u.name ?? "Sin nombre"}
                                            </div>
                                            <div className="text-muted-foreground truncate max-w-[260px]">
                                                {u.email}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-2">
                                        {money(b?.price ?? null, b?.currencyCode ?? "COP")}
                                    </TableCell>

                                    <TableCell className="py-2 truncate max-w-[180px]">
                                        {b?.paymentMethodLabel ?? "—"}
                                    </TableCell>

                                    <TableCell className="py-2">
                                        {StatusBadgePaid(b?.billingStatus ?? "UNPAID")}
                                    </TableCell>

                                    <TableCell className="py-2">
                                        {StatusBadgeAccess(b?.accessStatus ?? "ACTIVE")}
                                    </TableCell>

                                    <TableCell className="py-2">
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
                                                <DropdownMenuLabel>
                                                    Acciones
                                                </DropdownMenuLabel>

                                                <DropdownMenuItem
                                                    onClick={() => openEdit(u)}
                                                >
                                                    Editar pagos
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => handleMarkPaid(u.id)}
                                                >
                                                    Marcar pagó
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => handleMarkUnpaid(u.id)}
                                                >
                                                    Marcar no pagó
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => handleSuspend(u.id)}
                                                >
                                                    Suspender servicio
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
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
                                <TableCell colSpan={12} className="py-6 text-center">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

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
                            <DialogDescription>
                                Configura precio, medio y fecha de vencimiento.
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="max-h-[70vh] pr-3">
                            <div className="grid gap-2 p-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">Precio</label>
                                        <Input
                                            value={dialog.form.price}
                                            onChange={(e) =>
                                                setDialog((s) => ({
                                                    ...s,
                                                    form: { ...s.form, price: e.target.value },
                                                }))
                                            }
                                            placeholder="Ej: 129000"
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">Moneda</label>
                                        <Input
                                            value={dialog.form.currencyCode}
                                            onChange={(e) =>
                                                setDialog((s) => ({
                                                    ...s,
                                                    form: { ...s.form, currencyCode: e.target.value },
                                                }))
                                            }
                                            placeholder="COP"
                                            className="h-9"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-muted-foreground">
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
                                        className="h-9"
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-muted-foreground">
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
                                        className="h-9"
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-muted-foreground">
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
                                        className="h-9"
                                    />
                                </div>

                                <div className="mt-2 grid gap-3">
                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">Servicio</label>
                                        <Input
                                            value={dialog.form.serviceName}
                                            onChange={(e) =>
                                                setDialog((s) => ({
                                                    ...s,
                                                    form: { ...s.form, serviceName: e.target.value },
                                                }))
                                            }
                                            placeholder='Ej: Agente IA / CRM / Licencia'
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">
                                            Número notificación (remoteJid destino)
                                        </label>
                                        <Input
                                            value={dialog.form.notifyRemoteJid}
                                            onChange={(e) =>
                                                setDialog((s) => ({
                                                    ...s,
                                                    form: { ...s.form, notifyRemoteJid: e.target.value },
                                                }))
                                            }
                                            placeholder="Ej: 573001112233 o 573001112233@s.whatsapp.net"
                                            className="h-9"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Si queda vacío, se usará el <b>notificationNumber</b> del usuario.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <label className="text-muted-foreground">Fecha inicio</label>
                                            <Input
                                                type="date"
                                                value={dialog.form.serviceStartAt}
                                                onChange={(e) =>
                                                    setDialog((s) => ({
                                                        ...s,
                                                        form: { ...s.form, serviceStartAt: e.target.value },
                                                    }))
                                                }
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="grid gap-1">
                                            <label className="text-muted-foreground">
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
                                                className="h-9"
                                            />
                                        </div>

                                        {/* <div className="grid gap-1">
                                            <label className="text-muted-foreground">Fin ciclo (serviceEndsAt)</label>
                                            <Input
                                                type="date"
                                                value={dialog.form.serviceEndsAt}
                                                onChange={(e) =>
                                                    setDialog((s) => ({
                                                        ...s,
                                                        form: { ...s.form, serviceEndsAt: e.target.value },
                                                    }))
                                                }
                                                className="h-9"
                                            />
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

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