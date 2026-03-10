"use client";

import { useEffect, useRef, type RefObject } from "react";

import { flexRender } from "@tanstack/react-table";
import type { Table as TanStackTable } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { RegistroWithSession } from "@/types/session";

import type { CrmDashboardTab } from "./types";

export function CrmRecordsDataTable({
    table,
    activeTab,
    dataLength,
    hasMore,
    isLoadingMore,
    sentinelRef,
    onScrollRootReady,
}: {
    table: TanStackTable<RegistroWithSession>;
    activeTab: CrmDashboardTab;
    dataLength: number;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    sentinelRef: RefObject<HTMLDivElement>;
    onScrollRootReady: (el: HTMLDivElement | null) => void;
}) {
    const scrollAreaWrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const wrap = scrollAreaWrapRef.current;
        if (!wrap) {
            onScrollRootReady(null);
            return;
        }

        const viewport = wrap.querySelector<HTMLDivElement>(
            "[data-radix-scroll-area-viewport]"
        );

        onScrollRootReady(viewport ?? null);

        return () => {
            onScrollRootReady(null);
        };
    }, [activeTab, dataLength, onScrollRootReady]);

    const visibleColumnCount = table.getVisibleFlatColumns().length;

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                    <div ref={scrollAreaWrapRef} className="min-w-0">
                        <ScrollArea className="h-[420px] rounded-xl border border-border/70 bg-background lg:h-[520px]">
                            <Table className="w-full border-border table-auto">
                                <TableHeader className="sticky top-0">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow
                                            key={headerGroup.id}
                                            className="hover:bg-transparent"
                                        >
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>

                                <TableBody>
                                    {table.getRowModel().rows.length > 0 ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="hover:bg-accent/30"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="align-top py-3"
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={visibleColumnCount}
                                                className="h-28 text-center text-muted-foreground"
                                            >
                                                No hay registros para los filtros actuales.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div ref={sentinelRef} className="flex h-12 items-center justify-center">
                                {isLoadingMore ? (
                                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Cargando más registros...
                                    </span>
                                ) : hasMore ? (
                                    <span className="text-xs text-muted-foreground">
                                        Desplaza para cargar más resultados.
                                    </span>
                                ) : dataLength > 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        Ya no hay más registros por cargar.
                                    </span>
                                ) : null}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
