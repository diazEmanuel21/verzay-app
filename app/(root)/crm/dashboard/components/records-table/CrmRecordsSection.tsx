"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    CalendarDays,
    FileText,
    Handshake,
    Inbox,
    LayoutGrid,
    TriangleAlert,
    Wallet,
    X,
} from "lucide-react";

import type { RegistrosFilters } from "@/actions/registro-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTipoLabel } from "../../../helpers";

import {
    CRM_DEFAULT_COLUMN_VISIBILITY,
    CRM_TABS,
    FOLLOW_UP_FILTER_OPTIONS,
    isCrmTabValue,
} from "./constants";
import { createCrmRecordColumns } from "./crm-record-columns";
import { CrmRecordsDataTable } from "./CrmRecordsDataTable";
import { CrmRecordsToolbar } from "./CrmRecordsToolbar";
import type { CrmRecordsSectionProps } from "./types";

const CRM_TAB_ICONS = {
    TODOS: LayoutGrid,
    REPORTE: FileText,
    SOLICITUD: Inbox,
    PEDIDO: Handshake,
    RECLAMO: TriangleAlert,
    PAGO: Wallet,
    RESERVA: CalendarDays,
} as const;

function sanitizeFilters(filters: RegistrosFilters) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
    ) as RegistrosFilters;
}

export function CrmRecordsSection({
    activeTab,
    registros,
    totalRegistros,
    countsByTipo,
    filters,
    onActiveTabChange,
    onFiltersChange,
    onChangeEstado,
    onChangeDetalle,
    onFollowUpChanged,
    onProcessFollowUps,
    isProcessingFollowUps,
    isUpdatingRegistros,
    userId,
    hasMore,
    isLoadingMore,
    sentinelRef,
    onScrollRootReady,
}: CrmRecordsSectionProps) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: "fecha", desc: true },
    ]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        CRM_DEFAULT_COLUMN_VISIBILITY
    );
    const [searchValue, setSearchValue] = useState(filters.query ?? "");

    useEffect(() => {
        setSearchValue(filters.query ?? "");
    }, [filters.query]);

    const patchFilters = useCallback(
        (patch: Partial<RegistrosFilters>) => {
            onFiltersChange(
                sanitizeFilters({
                    ...filters,
                    ...patch,
                })
            );
        },
        [filters, onFiltersChange]
    );

    const resetFilters = useCallback(() => {
        onFiltersChange({});
    }, [onFiltersChange]);

    useEffect(() => {
        const normalizedSearch = searchValue.trim();
        const currentSearch = filters.query ?? "";
        if (normalizedSearch === currentSearch) return;

        const timeoutId = window.setTimeout(() => {
            patchFilters({
                query: normalizedSearch || undefined,
            });
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [filters.query, patchFilters, searchValue]);

    const columns = useMemo(
        () =>
            createCrmRecordColumns({
                userId,
                isUpdatingRegistros,
                onChangeEstado,
                onChangeDetalle,
                onFollowUpChanged,
            }),
        [
            userId,
            isUpdatingRegistros,
            onChangeEstado,
            onChangeDetalle,
            onFollowUpChanged,
        ]
    );

    const table = useReactTable({
        data: registros,
        columns,
        state: {
            sorting,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.query?.trim()) count += 1;
        if (filters.estado) count += 1;
        if (filters.followUpStatus) count += 1;
        if (filters.fechaDesde || filters.fechaHasta) count += 1;
        if (filters.leadOnly) count += 1;
        return count;
    }, [
        filters.estado,
        filters.fechaDesde,
        filters.fechaHasta,
        filters.followUpStatus,
        filters.leadOnly,
        filters.query,
    ]);

    const activeFilterBadges = useMemo(() => {
        const badges: Array<{
            key: string;
            label: string;
            onClear: () => void;
        }> = [];

        if (filters.query?.trim()) {
            badges.push({
                key: "query",
                label: `Búsqueda: ${filters.query.trim()}`,
                onClear: () => patchFilters({ query: undefined }),
            });
        }

        if (filters.estado) {
            badges.push({
                key: "estado",
                label: `Estado: ${filters.estado}`,
                onClear: () => patchFilters({ estado: undefined }),
            });
        }

        if (filters.followUpStatus) {
            const followUpLabel =
                FOLLOW_UP_FILTER_OPTIONS.find(
                    (option) => option.value === filters.followUpStatus
                )?.label ?? filters.followUpStatus;

            badges.push({
                key: "follow-up",
                label: `Follow-up: ${followUpLabel}`,
                onClear: () => patchFilters({ followUpStatus: undefined }),
            });
        }

        if (filters.fechaDesde || filters.fechaHasta) {
            badges.push({
                key: "fechas",
                label: `Fecha: ${filters.fechaDesde ?? "Inicio"} - ${filters.fechaHasta ?? "Hoy"}`,
                onClear: () =>
                    patchFilters({
                        fechaDesde: undefined,
                        fechaHasta: undefined,
                    }),
            });
        }

        if (filters.leadOnly) {
            badges.push({
                key: "lead",
                label: "Solo leads",
                onClear: () => patchFilters({ leadOnly: undefined }),
            });
        }

        return badges;
    }, [
        filters.estado,
        filters.fechaDesde,
        filters.fechaHasta,
        filters.followUpStatus,
        filters.leadOnly,
        filters.query,
        patchFilters,
    ]);

    return (
        <TooltipProvider delayDuration={120}>
            <Card className="min-w-0 border-border/70">
                <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base">Registros globales</CardTitle>
                            <CardDescription>
                                Vista tabular del CRM con búsqueda, filtros server-side y
                                edición inline.
                            </CardDescription>
                        </div>

                        <Badge variant="outline" className="w-fit rounded-md px-3 py-1">
                            <span className="sm:hidden">{registros.length} filas</span>
                            <span className="hidden sm:inline">
                                {registros.length} filas cargadas en esta vista
                            </span>
                        </Badge>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => {
                            if (isCrmTabValue(value)) {
                                onActiveTabChange(value);
                            }
                        }}
                        className="w-full"
                    >
                        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto whitespace-nowrap rounded-xl border border-border/70 bg-muted/40 p-1">
                            {CRM_TABS.map((tab) => {
                                const label =
                                    tab === "TODOS"
                                        ? `Todos (${totalRegistros})`
                                        : `${getTipoLabel(tab)} (${countsByTipo[tab]})`;
                                const Icon = CRM_TAB_ICONS[tab];

                                return (
                                    <Tooltip key={tab}>
                                        <TooltipTrigger asChild>
                                            <TabsTrigger
                                                value={tab}
                                                className="gap-2 px-3 max-sm:w-10 max-sm:px-0"
                                            >
                                                <Icon className="h-4 w-4 shrink-0 sm:hidden" />
                                                <span className="hidden sm:inline">{label}</span>
                                                <span className="sr-only sm:hidden">{label}</span>
                                            </TabsTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">{label}</TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </TabsList>
                    </Tabs>

                    <CrmRecordsToolbar
                        table={table}
                        activeTab={activeTab}
                        filters={filters}
                        filterCount={activeFilterCount}
                        searchValue={searchValue}
                        totalRegistros={totalRegistros}
                        loadedCount={registros.length}
                        isUpdatingRegistros={isUpdatingRegistros}
                        isProcessingFollowUps={isProcessingFollowUps}
                        onSearchChange={setSearchValue}
                        onPatchFilters={patchFilters}
                        onResetFilters={resetFilters}
                        onProcessFollowUps={onProcessFollowUps}
                    />

                    {activeFilterBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {activeFilterBadges.map((filterBadge) => (
                                <Badge
                                    key={filterBadge.key}
                                    variant="secondary"
                                    className="gap-2 rounded-full px-3 py-1 text-xs"
                                >
                                    {filterBadge.label}
                                    <button
                                        type="button"
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                        onClick={filterBadge.onClear}
                                        title={`Quitar filtro ${filterBadge.label}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={resetFilters}
                            >
                                Limpiar todo
                            </Button>
                        </div>
                    ) : null}
                </CardHeader>

                <CardContent className="pt-0">
                    <CrmRecordsDataTable
                        table={table}
                        activeTab={activeTab}
                        dataLength={registros.length}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        sentinelRef={sentinelRef}
                        onScrollRootReady={onScrollRootReady}
                    />
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
