// app/(dashboard)/crm/dashboard/components/TagStatsCard.tsx
"use client";

import useSWR from "swr";
import { getSessionTagStatsByUserId } from "@/actions/crm-seed-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FunnelChart, RelationBarChart, TagDonutChart } from "../helpers/TagCharts";

const fetcher = async (_: string, userId: string) => {
    const res = await getSessionTagStatsByUserId(userId);
    if (!res.success) throw new Error(res.message || "Error cargando stats");
    return res.data;
};

export function TagStatsCard({ userId }: { userId: string }) {
    const { data, error, isLoading } = useSWR(
        ["session-tag-stats", userId],
        ([key, uid]) => fetcher(key, uid)
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Embudo por Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Cargando...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Embudo por Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-destructive">
                        {(error as Error).message}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const stats = data || [];

    if (!stats.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Embudo por Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Aún no hay sesiones etiquetadas.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Si quieres respetar tus tags de embudo, puedes filtrar/ordenar aquí
    const ordered = stats.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return (
        <>
            <FunnelChart stats={stats} />
            <TagDonutChart stats={stats} />
            <RelationBarChart stats={stats} />
        </>
    );
}