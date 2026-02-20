"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { BarChart3, Activity, Filter } from "lucide-react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
} from "recharts";
import { RegistroWithSession, TipoRegistro } from "@/types/session";
import { formatFecha, getTipoLabel } from "../../helpers";
import { getDisplayNombreFromRegistro, getEstadoOptions, toDate } from "../helpers";
import { MetricCard } from "./MetricCard";
import { DashboardStats } from "./MainDashboard";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";


export const CrmDashboard = ({
    stats,
    registros,
    onChangeEstado,
    userId,
    sentinelRef,
    onScrollRootReady,
}: {
    stats: DashboardStats | null;
    registros: RegistroWithSession[];
    onChangeEstado?: (registroId: number, nuevoEstado: string) => void;
    userId: string;
    sentinelRef: React.RefObject<HTMLDivElement>;
    onScrollRootReady: (el: HTMLDivElement | null) => void;
}) => {
    const [activeTab, setActiveTab] = useState<"TODOS" | TipoRegistro>("TODOS");
    const scrollAreaWrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const wrap = scrollAreaWrapRef.current;
        if (!wrap) return;

        const viewport = wrap.querySelector<HTMLDivElement>(
            "[data-radix-scroll-area-viewport]"
        );

        onScrollRootReady(viewport ?? null);
    }, [onScrollRootReady, activeTab]);


    // Métricas (globales) desde stats
    const totalRegistros = stats?.totalRegistros ?? registros.length;
    const leadsConMovimientosFallback = useMemo(() => {
        const set = new Set<number>();
        for (const r of registros) set.add(r.sessionId);
        return set.size;
    }, [registros]);

    const leadsConMovimientos = stats?.leadsConMovimientos ?? leadsConMovimientosFallback;

    const countsByTipo = useMemo<Record<TipoRegistro, number>>(() => {
        if (stats?.countsByTipo) return stats.countsByTipo;

        const base: Record<TipoRegistro, number> = {
            REPORTE: 0, SOLICITUD: 0, PEDIDO: 0, RECLAMO: 0, PAGO: 0, RESERVA: 0,
        };
        for (const r of registros) base[r.tipo] += 1;
        return base;
    }, [stats?.countsByTipo, registros]);

    const chartDataByTipo = useMemo(
        () =>
            (Object.keys(countsByTipo) as TipoRegistro[]).map((tipo) => ({
                tipo: getTipoLabel(tipo),
                cantidad: countsByTipo[tipo],
            })),
        [countsByTipo]
    );

    // Actividad últimos 7 días (global) desde stats
    const chartDataByDay = useMemo(() => {
        if (stats?.chartDataByDay) return stats.chartDataByDay;
        return [];
    }, [stats]);

    // --- Métricas base ---
    // const totalRegistros = registros.length;

    // const leadsConMovimientos = useMemo(() => {
    //     const set = new Set<number>();
    //     for (const r of registros) set.add(r.sessionId);
    //     return set.size;
    // }, [registros]);

    // --- Registros por tipo ---
    // const countsByTipo = useMemo(() => {
    //     const base: Record<TipoRegistro, number> = {
    //         REPORTE: 0,
    //         SOLICITUD: 0,
    //         PEDIDO: 0,
    //         RECLAMO: 0,
    //         PAGO: 0,
    //         RESERVA: 0,
    //     };
    //     for (const r of registros) {
    //         base[r.tipo] = (base[r.tipo] ?? 0) + 1;
    //     }
    //     return base;
    // }, [registros]);

    // const chartDataByTipo = useMemo(
    //     () =>
    //         (Object.keys(countsByTipo) as TipoRegistro[]).map((tipo) => ({
    //             tipo: getTipoLabel(tipo),
    //             cantidad: countsByTipo[tipo],
    //         })),
    //     [countsByTipo]
    // );

    // --- Registros últimos 7 días ---
    // const chartDataByDay = useMemo(() => {
    //     const now = new Date();
    //     const daysMap = new Map<string, number>(); // key: yyyy-MM-dd

    //     for (let i = 6; i >= 0; i--) {
    //         const d = new Date(now);
    //         d.setDate(d.getDate() - i);
    //         const key = d.toISOString().slice(0, 10);
    //         daysMap.set(key, 0);
    //     }

    //     for (const r of registros) {
    //         const d = toDate(r.fecha || '');
    //         const key = d.toISOString().slice(0, 10);
    //         if (daysMap.has(key)) {
    //             daysMap.set(key, (daysMap.get(key) ?? 0) + 1);
    //         }
    //     }

    //     return Array.from(daysMap.entries()).map(([key, count]) => ({
    //         fecha: key.slice(5), // MM-DD
    //         cantidad: count,
    //     }));
    // }, [registros]);

    // --- Tablas globales ---
    const registrosFiltrados = useMemo(() => {
        if (activeTab === "TODOS") return registros;
        return registros.filter((r) => r.tipo === activeTab);
    }, [registros, activeTab]);

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard CRM
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Vista general de registros, leads y clientes asociados al CRM.
                    </p>
                </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid gap-3 md:grid-cols-2">
                <MetricCard
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Total registros"
                    value={totalRegistros}
                    helper="Todos los movimientos en CRM"
                />
                <MetricCard
                    icon={<Activity className="h-4 w-4" />}
                    label="Leads con movimientos"
                    value={(leadsConMovimientos)}
                    helper="Sessiones que tienen al menos un registro"
                />
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Registros por tipo */}
                <Card className="h-[260px] md:h-[300px] border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Registros por tipo</CardTitle>
                        <CardDescription className="text-xs">
                            Distribución general por módulo (reportes, pedidos, pagos, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] md:h-[230px]">
                        {totalRegistros === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                Aún no hay registros para mostrar en el gráfico.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartDataByTipo}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ opacity: 0.1 }}
                                        contentStyle={{ fontSize: 11 }}
                                    />
                                    <Bar
                                        dataKey="cantidad"
                                        fill="hsl(var(--primary))"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Registros últimos 7 días */}
                <Card className="h-[260px] md:h-[300px] border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Actividad últimos 7 días</CardTitle>
                        <CardDescription className="text-xs">
                            Cantidad de registros creados por día.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] md:h-[230px]">
                        {totalRegistros === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                Aún no hay registros para mostrar en el gráfico.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartDataByDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ opacity: 0.1 }}
                                        contentStyle={{ fontSize: 11 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cantidad"
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tags stats */}
            {/* TODO: DESCOMENTAR TAGS CUANDO EXISTAN */}
            {/* <TagStatsCard userId={userId} /> */}


            {/* TABLAS GLOBALES */}
            <Card className="flex flex-col border-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">Registros globales</CardTitle>
                        <CardDescription className="text-xs">
                            Vista consolidada de todos los registros del CRM, sin filtrar por
                            cliente.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] px-2"
                    >
                        <Filter className="h-3 w-3 mr-1" />
                        Filtros (próximamente)
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 min-h-0">
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) =>
                            setActiveTab(v as "TODOS" | TipoRegistro)
                        }
                        className="flex flex-col min-h-0"
                    >
                        <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-1 mb-2">
                            <TabsTrigger value="TODOS" className="text-[11px] px-2">
                                Todos ({totalRegistros})
                            </TabsTrigger>
                            <TabsTrigger value="REPORTE" className="text-[11px] px-2">
                                Reportes ({countsByTipo.REPORTE})
                            </TabsTrigger>
                            <TabsTrigger value="SOLICITUD" className="text-[11px] px-2">
                                Solicitudes ({countsByTipo.SOLICITUD})
                            </TabsTrigger>
                            <TabsTrigger value="PEDIDO" className="text-[11px] px-2">
                                Pedidos ({countsByTipo.PEDIDO})
                            </TabsTrigger>
                            <TabsTrigger value="RECLAMO" className="text-[11px] px-2">
                                Reclamos ({countsByTipo.RECLAMO})
                            </TabsTrigger>
                            <TabsTrigger value="PAGO" className="text-[11px] px-2">
                                Pagos ({countsByTipo.PAGO})
                            </TabsTrigger>
                            <TabsTrigger value="RESERVA" className="text-[11px] px-2">
                                Reservas ({countsByTipo.RESERVA})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-0">
                            <div ref={scrollAreaWrapRef}>
                                <ScrollArea className="h-[320px] rounded-md border">
                                    <Table className="text-xs">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="h-8 py-1.5 whitespace-nowrap">
                                                    WhatsApp
                                                </TableHead>
                                                <TableHead className="h-8 py-1.5 whitespace-nowrap">
                                                    Nombre
                                                </TableHead>
                                                <TableHead className="h-8 py-1.5 whitespace-nowrap">
                                                    Fecha
                                                </TableHead>
                                                <TableHead className="h-8 py-1.5">Detalle</TableHead>
                                                <TableHead className="h-8 py-1.5 text-right">
                                                    Estado
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {registrosFiltrados.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="h-16 text-center text-[11px] text-muted-foreground"
                                                    >
                                                        No hay registros para este filtro.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {registrosFiltrados.map((r) => {
                                                const nombre = getDisplayNombreFromRegistro(r);
                                                const tipoLabel = getTipoLabel(r.tipo);
                                                const detalle =
                                                    r.resumen || r.detalles || "Sin detalles";

                                                return (
                                                    <TableRow key={r.id} className="hover:bg-accent/40">
                                                        <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                            {r.session.remoteJid.split('@')[0]}
                                                        </TableCell>
                                                        <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                            {nombre}
                                                        </TableCell>
                                                        <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                            {formatFecha(r.fecha || '')}
                                                        </TableCell>
                                                        <TableCell className="py-1.5 align-top max-w-[280px]">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="w-full text-left truncate whitespace-nowrap text-xs leading-5 cursor-pointer hover:underline underline-offset-2"
                                                                        title="Ver detalle completo"
                                                                    >
                                                                        {detalle}
                                                                    </button>
                                                                </PopoverTrigger>

                                                                <PopoverContent
                                                                    side="top"
                                                                    align="start"
                                                                    className="w-[520px] p-0"
                                                                >
                                                                    <div className="border-b px-3 py-2">
                                                                        <p className="text-[11px] text-muted-foreground">
                                                                            Detalle completo
                                                                        </p>
                                                                    </div>

                                                                    <ScrollArea className="max-h-[260px] px-3 py-2">
                                                                        <p className="text-[12px] leading-relaxed whitespace-pre-wrap break-words">
                                                                            {detalle}
                                                                        </p>
                                                                    </ScrollArea>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </TableCell>
                                                        <TableCell className="py-1.5 align-top text-right">
                                                            <Select
                                                                value={r.estado ?? 'pendiente'}
                                                                onValueChange={(value) => {
                                                                    if (value === r.estado) return;
                                                                    onChangeEstado?.(r.id, value);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 w-[150px] text-[10px] justify-between">
                                                                    <SelectValue placeholder="Seleccionar estado" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {getEstadoOptions(r.tipo).map((estado) => (
                                                                        <SelectItem
                                                                            key={estado}
                                                                            value={estado}
                                                                            className="text-[11px]"
                                                                        >
                                                                            {estado}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <div ref={sentinelRef} className="h-8" />
                                </ScrollArea>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};