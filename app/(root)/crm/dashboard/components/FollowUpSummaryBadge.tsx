"use client";

import { useState } from "react";

import {
    cancelSessionFollowUps,
    processDueFollowUpsNow,
    retrySessionFailedFollowUps,
} from "@/actions/follow-up-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SessionFollowUpHistoryItem, SessionFollowUpSummary } from "@/types/session";
import { toast } from "sonner";

const STATUS_LABELS = {
    pending: "Pendiente",
    processing: "Procesando",
    sent: "Enviado",
    failed: "Fallido",
    cancelled: "Cancelado",
} as const;

function getStatusClassName(status: SessionFollowUpSummary["latestStatus"]) {
    switch (status) {
        case "pending":
            return "border-amber-200 bg-amber-50 text-amber-700";
        case "processing":
            return "border-sky-200 bg-sky-50 text-sky-700";
        case "sent":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "failed":
            return "border-rose-200 bg-rose-50 text-rose-700";
        case "cancelled":
            return "border-slate-200 bg-slate-100 text-slate-700";
        default:
            return "border-slate-200 bg-slate-50 text-slate-600";
    }
}

function formatFollowUpDate(value?: string | null) {
    if (!value) return null;

    return new Date(value).toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function getHistoryAttemptLabel(item: SessionFollowUpHistoryItem) {
    if (item.status === "pending" && item.attempt === 0) return "Aun no ejecutado";
    return `Intento ${Math.max(item.attempt, 1)}`;
}

export function FollowUpSummaryBadge({
    summary,
    userId,
    remoteJid,
    instanceId,
    onUpdated,
}: {
    summary?: SessionFollowUpSummary | null;
    userId?: string;
    remoteJid?: string | null;
    instanceId?: string | null;
    onUpdated?: () => Promise<void> | void;
}) {
    const [pendingAction, setPendingAction] = useState<"cancel" | "retry" | "process" | null>(null);

    if (!summary || summary.total === 0) {
        return (
            <span className="text-xs text-muted-foreground">
                Sin follow-up
            </span>
        );
    }

    const latestLabel = summary.latestStatus
        ? STATUS_LABELS[summary.latestStatus]
        : "Sin estado";

    const formattedLatestDate = formatFollowUpDate(summary.latestCreatedAt);

    const canManage = Boolean(userId && remoteJid && instanceId);
    const canCancel = canManage && summary.active > 0;
    const canRetry = canManage && summary.failed > 0;
    const canProcessNow = canManage && summary.pending > 0;

    const renderBadges = () => (
        <div className="flex max-w-[210px] flex-wrap gap-1">
            <Badge variant="outline" className={getStatusClassName(summary.latestStatus)}>
                {latestLabel}
            </Badge>

            {summary.active > 0 && (
                <Badge variant="outline" className="border-sky-200 text-sky-700">
                    Activos {summary.active}
                </Badge>
            )}

            {summary.sent > 0 && (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    Enviados {summary.sent}
                </Badge>
            )}

            {summary.failed > 0 && (
                <Badge variant="outline" className="border-rose-200 text-rose-700">
                    Fallidos {summary.failed}
                </Badge>
            )}
        </div>
    );

    const handleAction = async (action: "cancel" | "retry" | "process") => {
        if (!userId || !remoteJid || !instanceId) return;

        const toastId = `follow-up-${action}-${instanceId}-${remoteJid}`;
        toast.loading(
            action === "cancel"
                ? "Cancelando follow-ups..."
                : action === "retry"
                    ? "Reactivando follow-ups..."
                    : "Procesando follow-ups de esta sesion...",
            { id: toastId }
        );
        setPendingAction(action);

        try {
            const result =
                action === "cancel"
                    ? await cancelSessionFollowUps({
                        userId,
                        remoteJid,
                        instanceId,
                    })
                    : action === "retry"
                        ? await retrySessionFailedFollowUps({
                            userId,
                            remoteJid,
                            instanceId,
                        })
                        : await processDueFollowUpsNow(userId, {
                            remoteJid,
                            instanceId,
                            limit: 25,
                        });

            if (!result.success) {
                toast.error(result.message, { id: toastId });
                return;
            }

            await onUpdated?.();
            toast.success(result.message, { id: toastId });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "No se pudo actualizar el follow-up.",
                { id: toastId }
            );
        } finally {
            setPendingAction(null);
        }
    };

    const hasDetail = !!summary.latestGeneratedMessage || !!formattedLatestDate;
    const hasActions = canCancel || canRetry || canProcessNow;

    if (!hasDetail && !hasActions) {
        return renderBadges();
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="text-left"
                    title="Ver ultimo follow-up"
                >
                    {renderBadges()}
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[360px] p-3">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Ultimo follow-up</p>
                        <p className="text-xs text-muted-foreground">
                            {formattedLatestDate
                                ? `Ultima actividad: ${formattedLatestDate}`
                                : "Sin fecha disponible"}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {renderBadges()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Total: {summary.total}</span>
                        <span>Procesando: {summary.processing}</span>
                        <span>Pendientes: {summary.pending}</span>
                        <span>Cancelados: {summary.cancelled}</span>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium">Mensaje generado</p>
                        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {summary.latestGeneratedMessage || "No hay mensaje generado todavia."}
                        </p>
                    </div>

                    {summary.recentItems.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-medium">Historial reciente</p>
                            <div className="space-y-2">
                                {summary.recentItems.map((item) => {
                                    const createdAt = formatFollowUpDate(item.createdAt);
                                    const updatedAt = formatFollowUpDate(item.updatedAt);
                                    const statusLabel = STATUS_LABELS[item.status];

                                    return (
                                        <div
                                            key={item.id}
                                            className="rounded-md border border-border/70 bg-muted/20 p-2"
                                        >
                                            <div className="flex flex-wrap items-center gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusClassName(item.status)}
                                                >
                                                    {statusLabel}
                                                </Badge>
                                                <Badge variant="outline" className="border-slate-200 text-slate-700">
                                                    {item.mode === "ai" ? "IA" : "Estatico"}
                                                </Badge>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {getHistoryAttemptLabel(item)}
                                                </span>
                                            </div>

                                            <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                                                <span>
                                                    Creado: {createdAt ?? "Sin fecha"}
                                                </span>
                                                <span>
                                                    Actualizado: {updatedAt ?? "Sin fecha"}
                                                </span>
                                            </div>

                                            <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                                                {item.message || "Sin mensaje almacenado."}
                                            </p>

                                            {item.errorReason && (
                                                <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1">
                                                    <p className="text-[11px] font-medium text-rose-700">
                                                        Error
                                                    </p>
                                                    <p className="whitespace-pre-wrap text-xs text-rose-700">
                                                        {item.errorReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {hasActions && (
                        <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                            {canProcessNow && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pendingAction !== null}
                                    onClick={() => handleAction("process")}
                                >
                                    Procesar ahora
                                </Button>
                            )}

                            {canRetry && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pendingAction !== null}
                                    onClick={() => handleAction("retry")}
                                >
                                    Reactivar fallidos
                                </Button>
                            )}

                            {canCancel && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pendingAction !== null}
                                    onClick={() => handleAction("cancel")}
                                >
                                    Cancelar activos
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
