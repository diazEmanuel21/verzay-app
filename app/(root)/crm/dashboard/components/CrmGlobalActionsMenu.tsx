"use client";

import { useMemo, useState } from "react";
import { Ban, MoreHorizontal, RefreshCcw, Trash2 } from "lucide-react";

import {
  cancelUserActiveCrmFollowUps,
  deleteUserActiveCrmFollowUps,
  deleteUserSentCrmFollowUps,
  reactivateUserSentCrmFollowUps,
} from "@/actions/crm-follow-up-actions";
import { deleteAllRegistrosByUserId } from "@/actions/registro-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CrmConfirmActionDialog } from "./CrmConfirmActionDialog";
import type { DashboardStats } from "./MainDashboard";

type GlobalActionId =
  | "cancel-active-follow-ups"
  | "delete-active-follow-ups"
  | "delete-sent-follow-ups"
  | "reactivate-sent-follow-ups"
  | "delete-all-records";

export function CrmGlobalActionsMenu({
  userId,
  stats,
  onDataChanged,
}: {
  userId: string;
  stats: DashboardStats | null;
  onDataChanged?: () => Promise<void> | void;
}) {
  const [selectedAction, setSelectedAction] = useState<GlobalActionId | null>(null);

  const activeFollowUpsCount = stats?.crmFollowUps.active ?? 0;
  const sentFollowUpsCount = stats?.crmFollowUps.sent ?? 0;
  const totalRegistros = stats?.totalRegistros ?? 0;
  const leadsConMovimientos = stats?.leadsConMovimientos ?? 0;

  const actions = useMemo(
    () =>
      ({
        "cancel-active-follow-ups": {
          label: `Cancelar follow-ups activos (${activeFollowUpsCount})`,
          description:
            "Marcara como cancelados todos los follow-ups pendientes o en proceso del CRM.",
          confirmLabel: "Cancelar activos",
          tone: "destructive" as const,
          disabled: activeFollowUpsCount === 0,
          execute: () => cancelUserActiveCrmFollowUps(userId),
        },
        "delete-active-follow-ups": {
          label: `Eliminar follow-ups activos (${activeFollowUpsCount})`,
          description:
            "Eliminara definitivamente los follow-ups activos. Esta accion no se puede deshacer.",
          confirmLabel: "Eliminar activos",
          tone: "destructive" as const,
          disabled: activeFollowUpsCount === 0,
          execute: () => deleteUserActiveCrmFollowUps(userId),
        },
        "delete-sent-follow-ups": {
          label: `Eliminar follow-ups enviados (${sentFollowUpsCount})`,
          description:
            "Eliminara el historial de follow-ups ya enviados. Esta accion no se puede deshacer.",
          confirmLabel: "Eliminar enviados",
          tone: "destructive" as const,
          disabled: sentFollowUpsCount === 0,
          execute: () => deleteUserSentCrmFollowUps(userId),
        },
        "reactivate-sent-follow-ups": {
          label: `Reactivar follow-ups enviados (${sentFollowUpsCount})`,
          description:
            "Reprogramara nuevamente los follow-ups enviados usando las reglas actuales del CRM.",
          confirmLabel: "Reactivar enviados",
          tone: "default" as const,
          disabled: sentFollowUpsCount === 0,
          execute: () => reactivateUserSentCrmFollowUps(userId),
        },
        "delete-all-records": {
          label: `Eliminar todos los registros (${totalRegistros})`,
          description:
            totalRegistros === 0
              ? "No hay registros cargados actualmente en el CRM."
              : `Eliminara ${totalRegistros} registros y vaciara los movimientos de ${leadsConMovimientos} leads. Esta accion no se puede deshacer.`,
          confirmLabel: "Eliminar registros",
          tone: "destructive" as const,
          disabled: totalRegistros === 0,
          execute: () => deleteAllRegistrosByUserId(userId),
        },
      }) satisfies Record<
        GlobalActionId,
        {
          label: string;
          description: string;
          confirmLabel: string;
          tone: "default" | "destructive";
          disabled: boolean;
          execute: () => Promise<{ success: boolean; message: string }>;
        }
      >,
    [
      activeFollowUpsCount,
      leadsConMovimientos,
      sentFollowUpsCount,
      totalRegistros,
      userId,
    ]
  );

  const currentAction = selectedAction ? actions[selectedAction] : null;

  const handleConfirm = async () => {
    if (!selectedAction) return;

    const action = actions[selectedAction];
    const toastId = `crm-global-action-${selectedAction}`;

    toast.loading("Aplicando cambios globales en el CRM...", { id: toastId });

    const result = await action.execute();
    if (!result.success) {
      toast.error(result.message, { id: toastId });
      throw new Error(result.message);
    }

    await onDataChanged?.();
    toast.success(result.message, { id: toastId });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <MoreHorizontal className="h-4 w-4" />
            Acciones globales
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Follow-ups</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={actions["cancel-active-follow-ups"].disabled}
            onSelect={() => setSelectedAction("cancel-active-follow-ups")}
          >
            <Ban className="h-4 w-4" />
            {actions["cancel-active-follow-ups"].label}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={actions["delete-active-follow-ups"].disabled}
            onSelect={() => setSelectedAction("delete-active-follow-ups")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {actions["delete-active-follow-ups"].label}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={actions["delete-sent-follow-ups"].disabled}
            onSelect={() => setSelectedAction("delete-sent-follow-ups")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {actions["delete-sent-follow-ups"].label}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={actions["reactivate-sent-follow-ups"].disabled}
            onSelect={() => setSelectedAction("reactivate-sent-follow-ups")}
          >
            <RefreshCcw className="h-4 w-4" />
            {actions["reactivate-sent-follow-ups"].label}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Registros</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={actions["delete-all-records"].disabled}
            onSelect={() => setSelectedAction("delete-all-records")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {actions["delete-all-records"].label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {currentAction ? (
        <CrmConfirmActionDialog
          open={selectedAction !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedAction(null);
          }}
          title={currentAction.label}
          description={currentAction.description}
          confirmLabel={currentAction.confirmLabel}
          tone={currentAction.tone}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
