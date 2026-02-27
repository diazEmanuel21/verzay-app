"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClientRow } from "@/types/billing";
import { daysLeftService } from "../helpers";
import { Database, CircleCheck, CircleX, UserCheck, UserX } from "lucide-react";

type Props = {
    table: Table<ClientRow>;
    data: ClientRow[];
    className?: string;
    soonDays?: number; // default 3
};

function StatCard({
    title,
    value,
    icon,
    active,
    onClick,
    activeClassName,
    valueClassName,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    activeClassName?: string;
    valueClassName?: string;
}) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "cursor-pointer select-none border-border bg-background/40 backdrop-blur",
                "hover:bg-background/60 transition-colors",
                "rounded-xl px-5 py-4 flex items-center justify-between gap-3",
                active && (activeClassName ?? "ring-1 ring-primary")
            )}
        >
            <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{icon}</div>
                <div className="leading-tight">
                    <div className="text-xs text-muted-foreground">{title}</div>
                    <div className={cn("text-lg font-semibold", valueClassName)}>{value}</div>
                </div>
            </div>
        </Card>
    );
}

export function BillingCrmFiltersCards({
    table,
    data,
    className,
    soonDays = 3,
}: Props) {
    // Estados actuales de filtros (TanStack)
    const paidFilter = table.getColumn("paid")?.getFilterValue() as string | undefined;
    const accessFilter = table.getColumn("access")?.getFilterValue() as string | undefined;

    // Métricas (sobre data completa)
    const total = data.length;

    const paidCount = React.useMemo(
        () => data.filter((u) => (u.billing?.billingStatus ?? "UNPAID") === "PAID").length,
        [data]
    );

    const unpaidCount = React.useMemo(
        () => data.filter((u) => (u.billing?.billingStatus ?? "UNPAID") !== "PAID").length,
        [data]
    );

    const accessActiveCount = React.useMemo(
        () => data.filter((u) => (u.billing?.accessStatus ?? "ACTIVE") === "ACTIVE").length,
        [data]
    );

    const accessSuspendedCount = React.useMemo(
        () => data.filter((u) => (u.billing?.accessStatus ?? "ACTIVE") !== "ACTIVE").length,
        [data]
    );

    const dueSoonCount = React.useMemo(() => {
        return data.filter((u) => {
            const due = u.billing?.dueDate ?? null;
            const left = parseInt(daysLeftService(due));
            return Number.isFinite(left) && left >= 0 && left <= soonDays;
        }).length;
    }, [data, soonDays]);

    function toggleColumnFilter(colId: "paid" | "access", value: string) {
        const col = table.getColumn(colId);
        if (!col) return;

        const curr = col.getFilterValue() as string | undefined;
        col.setFilterValue(curr === value ? undefined : value);
    }

    function clearAllQuickFilters() {
        table.getColumn("paid")?.setFilterValue(undefined);
        table.getColumn("access")?.setFilterValue(undefined);
    }

    const dueFilter = table.getColumn("due")?.getFilterValue() as string | undefined;

    function toggleDueSoon() {
        const col = table.getColumn("due");
        if (!col) return;
        col.setFilterValue(dueFilter === "SOON" ? undefined : "SOON");
    }

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-3", className)}>
            <StatCard
                title="Total"
                value={total}
                icon={<Database className="h-4 w-4" />}
                active={!paidFilter && !accessFilter}
                onClick={clearAllQuickFilters}
            />

            <StatCard
                title="Pagaron"
                value={paidCount}
                icon={<CircleCheck className="h-4 w-4" />}
                active={paidFilter === "PAID"}
                onClick={() => toggleColumnFilter("paid", "PAID")}
                valueClassName="text-emerald-400"
                activeClassName="ring-1 ring-emerald-500/60"
            />

            <StatCard
                title="No pagaron"
                value={unpaidCount}
                icon={<CircleX className="h-4 w-4" />}
                active={paidFilter === "UNPAID"}
                onClick={() => toggleColumnFilter("paid", "UNPAID")}
                valueClassName="text-red-400"
                activeClassName="ring-1 ring-red-500/60"
            />

            <StatCard
                title="Servicio activo"
                value={accessActiveCount}
                icon={<UserCheck className="h-4 w-4" />}
                active={accessFilter === "ACTIVE"}
                onClick={() => toggleColumnFilter("access", "ACTIVE")}
                valueClassName="text-emerald-400"
                activeClassName="ring-1 ring-emerald-500/60"
            />


            <StatCard
                title={`Vence pronto (≤ ${soonDays}d)`}
                value={dueSoonCount}
                icon={<UserX className="h-4 w-4" />}
                active={dueFilter === "SOON"}
                onClick={toggleDueSoon}
                valueClassName={dueSoonCount > 0 ? "text-yellow-300" : undefined}
                activeClassName="ring-1 ring-yellow-500/60"
            />
        </div>
    );
}