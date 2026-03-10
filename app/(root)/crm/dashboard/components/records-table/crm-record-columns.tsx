"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RegistroWithSession } from "@/types/session";
import { FollowUpSummaryBadge } from "../FollowUpSummaryBadge";
import { formatFecha, getTipoLabel } from "../../../helpers";
import {
    getDisplayNombreFromRegistro,
    getDisplayWhatsappFromSession,
} from "../../helpers";

import { CrmRecordDetailCell } from "./CrmRecordDetailCell";
import { CrmRecordStatusCell } from "./CrmRecordStatusCell";

function SortableHeader({
    column,
    label,
}: {
    column: Column<RegistroWithSession>;
    label: string;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
    );
}

export function createCrmRecordColumns({
    userId,
    isUpdatingRegistros,
    onChangeEstado,
    onChangeDetalle,
    onFollowUpChanged,
}: {
    userId: string;
    isUpdatingRegistros?: boolean;
    onChangeEstado?: (registroId: number, nuevoEstado: string) => void;
    onChangeDetalle?: (registroId: number, nuevoDetalle: string) => Promise<boolean>;
    onFollowUpChanged?: () => Promise<void> | void;
}): ColumnDef<RegistroWithSession>[] {
    return [
        {
            id: "whatsapp",
            accessorFn: (row) => getDisplayWhatsappFromSession(row.session),
            enableHiding: false,
            header: ({ column }) => (
                <SortableHeader column={column} label="WhatsApp" />
            ),
            cell: ({ row }) => {
                const whatsapp = getDisplayWhatsappFromSession(row.original.session);

                return (
                    <div className="min-w-[120px]">
                        <p className="font-medium">{whatsapp}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.original.session.instanceId}
                        </p>
                    </div>
                );
            },
        },
        {
            id: "nombre",
            accessorFn: (row) => getDisplayNombreFromRegistro(row),
            enableHiding: false,
            header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
            cell: ({ row }) => {
                const nombre = getDisplayNombreFromRegistro(row.original);
                const sessionName = row.original.session.pushName;
                const showSessionName =
                    !!sessionName &&
                    sessionName.trim() !== "" &&
                    sessionName.trim() !== nombre.trim();

                return (
                    <div className="min-w-[180px]">
                        <p className="font-medium">{nombre}</p>
                        {showSessionName ? (
                            <p className="text-xs text-muted-foreground">
                                Sesión: {sessionName}
                            </p>
                        ) : null}
                    </div>
                );
            },
        },
        {
            id: "tipo",
            accessorFn: (row) => getTipoLabel(row.tipo),
            header: ({ column }) => <SortableHeader column={column} label="Tipo" />,
            cell: ({ row }) => (
                <span className="inline-flex rounded-full border border-border/80 px-2 py-1 text-xs font-medium">
                    {getTipoLabel(row.original.tipo)}
                </span>
            ),
        },
        {
            id: "fecha",
            accessorFn: (row) =>
                row.fecha ? new Date(row.fecha).getTime() : Number.NEGATIVE_INFINITY,
            header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
            cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm">
                    {formatFecha(row.original.fecha || "")}
                </span>
            ),
        },
        {
            id: "detalle",
            accessorFn: (row) => row.resumen ?? row.detalles ?? "",
            header: () => (
                <span className="text-xs font-medium text-muted-foreground">
                    Detalle
                </span>
            ),
            enableSorting: false,
            cell: ({ row }) => (
                <CrmRecordDetailCell
                    registro={row.original}
                    onChangeDetalle={onChangeDetalle}
                />
            ),
        },
        {
            id: "followUp",
            accessorFn: (row) => {
                const latestCreatedAt = row.session.followUpSummary?.latestCreatedAt;
                return latestCreatedAt ? new Date(latestCreatedAt).getTime() : 0;
            },
            header: ({ column }) => (
                <SortableHeader column={column} label="Follow-up" />
            ),
            cell: ({ row }) => (
                <div className="min-w-[220px]">
                    <FollowUpSummaryBadge
                        summary={row.original.session.followUpSummary}
                        userId={userId}
                        remoteJid={row.original.session.remoteJid}
                        instanceId={row.original.session.instanceId}
                        onUpdated={onFollowUpChanged}
                    />
                </div>
            ),
        },
        {
            id: "estado",
            accessorFn: (row) => row.estado ?? "",
            header: ({ column }) => <SortableHeader column={column} label="Estado" />,
            cell: ({ row }) => (
                <CrmRecordStatusCell
                    registro={row.original}
                    disabled={isUpdatingRegistros}
                    onChangeEstado={onChangeEstado}
                />
            ),
        },
    ];
}
