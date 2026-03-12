"use client";

import { useState } from "react";

import {
  cancelSessionCrmFollowUps,
  processDueCrmFollowUpsNow,
  retrySessionFailedCrmFollowUps,
} from "@/actions/crm-follow-up-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SessionCrmFollowUpHistoryItem,
  SessionCrmFollowUpSummary,
} from "@/types/session";
import { toast } from "sonner";
import { getLeadStatusLabel } from "../helpers";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SENT: "Enviado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado",
  SKIPPED: "Omitido",
} as const;

function getStatusClassName(status: SessionCrmFollowUpSummary["latestStatus"]) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PROCESSING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "SENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "SKIPPED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getHistoryAttemptLabel(item: SessionCrmFollowUpHistoryItem) {
  if (item.status === "PENDING" && item.attemptCount === 0) return "Aun no ejecutado";
  return `Intento ${Math.max(item.attemptCount, 1)}`;
}

export function CrmFollowUpSummaryBadge({
  summary,
  userId,
  remoteJid,
  instanceId,
  onUpdated,
}: {
  summary?: SessionCrmFollowUpSummary | null;
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

  const formattedLatestDate = formatDate(summary.latestScheduledFor);

  const canManage = Boolean(userId && remoteJid && instanceId);
  const canCancel = canManage && summary.active > 0;
  const canRetry = canManage && summary.failed > 0;
  const canProcessNow = canManage && summary.pending > 0;

  const renderBadges = () => (
    <div className="flex max-w-[220px] flex-wrap gap-1">
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

    const toastId = `crm-follow-up-${action}-${instanceId}-${remoteJid}`;
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
          ? await cancelSessionCrmFollowUps({
              userId,
              remoteJid,
              instanceId,
            })
          : action === "retry"
            ? await retrySessionFailedCrmFollowUps({
                userId,
                remoteJid,
                instanceId,
              })
            : await processDueCrmFollowUpsNow(userId, {
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

  const hasActions = canCancel || canRetry || canProcessNow;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-left"
          title="Ver follow-up"
        >
          {renderBadges()}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[380px] p-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Follow-up IA</p>
            <p className="text-xs text-muted-foreground">
              {formattedLatestDate
                ? `Proximo envio: ${formattedLatestDate}`
                : "Sin programacion disponible"}
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
            <p className="text-xs font-medium">Ultimo mensaje</p>
            <p className="whitespace-pre-wrap text-xs text-muted-foreground">
              {summary.latestGeneratedMessage || "Aun no se ha enviado un mensaje."}
            </p>
          </div>

          {summary.recentItems.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium">Historial reciente</p>
              <div className="space-y-2">
                {summary.recentItems.map((item) => {
                  const scheduledFor = formatDate(item.scheduledFor);
                  const updatedAt = formatDate(item.updatedAt);

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
                          {STATUS_LABELS[item.status]}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-700">
                          {getLeadStatusLabel(item.leadStatusSnapshot)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {getHistoryAttemptLabel(item)}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                        <span>Programado: {scheduledFor ?? "Sin fecha"}</span>
                        <span>Actualizado: {updatedAt ?? "Sin fecha"}</span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {item.message || "Sin mensaje almacenado."}
                      </p>

                      {item.errorReason && (
                        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1">
                          <p className="text-[11px] font-medium text-rose-700">Error</p>
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
