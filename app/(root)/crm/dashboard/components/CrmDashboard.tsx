"use client";

import { useEffect, useMemo, useRef } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { getDisplayNombreFromRegistro, getEstadoOptions } from "../helpers";
import { MetricCard } from "./MetricCard";
import { DashboardStats } from "./MainDashboard";
import { RegistrosFilters } from "@/actions/registro-action";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TagStatsCard } from "./TagStatsCard";
import { ESTADOS_POR_TIPO } from "@/types/registro";

const CRM_TABS = ["TODOS", "REPORTE", "SOLICITUD", "PEDIDO", "RECLAMO", "PAGO", "RESERVA"] as const;
type CrmTabValue = (typeof CRM_TABS)[number];
const isCrmTabValue = (value: string): value is CrmTabValue =>
    (CRM_TABS as readonly string[]).includes(value);


export const CrmDashboard = ({
    stats,
    registros,
    activeTab,
    onActiveTabChange,
    filters,
    onFiltersChange,
    onChangeEstado,
    userId,
    sentinelRef,
    onScrollRootReady,
}: {
    stats: DashboardStats | null;
    registros: RegistroWithSession[];
    activeTab: "TODOS" | TipoRegistro;
    onActiveTabChange: (value: "TODOS" | TipoRegistro) => void;
    filters: RegistrosFilters;
    onFiltersChange: (filters: RegistrosFilters) => void;
    onChangeEstado?: (registroId: number, nuevoEstado: string) => void;
    userId: string;
    sentinelRef: React.RefObject<HTMLDivElement>;
    onScrollRootReady: (el: HTMLDivElement | null) => void;
}) => {
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

    const estadoOptions = useMemo(() => {
        if (activeTab === "TODOS") {
            const set = new Set<string>();
            for (const key of Object.keys(ESTADOS_POR_TIPO) as TipoRegistro[]) {
                for (const estado of ESTADOS_POR_TIPO[key]) set.add(estado);
            }
            return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
        }
        return getEstadoOptions(activeTab);
    }, [activeTab]);

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
    const registrosFiltrados = registros;

    return (
        <div className="flex flex-col gap-4 h-full">
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
                        <CardDescription>
                            Distribución general por módulo (reportes, pedidos, pagos, etc.).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] md:h-[230px]">
                        {totalRegistros === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
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
                            <div className="h-full flex items-center justify-center text-muted-foreground">
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
            <TagStatsCard userId={userId} />


            {/* TABLAS GLOBALES */}
            <Card className="flex flex-col border-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">Registros globales</CardTitle>
                        <CardDescription>
                            Vista consolidada de todos los registros del CRM, sin filtrar por
                            cliente.
                        </CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                            >
                                <Filter className="h-3 w-3 mr-1" />
                                Filtros
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[320px] p-3">
                            <div className="grid gap-3">
                                <div className="grid gap-1">
                                    <label className="text-muted-foreground">Estado</label>
                                    <Select
                                        value={filters.estado ?? "__all__"}
                                        onValueChange={(value) =>
                                            onFiltersChange({
                                                ...filters,
                                                estado: value === "__all__" ? undefined : value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">Todos</SelectItem>
                                            {estadoOptions.map((estado) => (
                                                <SelectItem key={estado} value={estado}>
                                                    {estado}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">Desde</label>
                                        <Input
                                            type="date"
                                            className="h-8"
                                            value={filters.fechaDesde ?? ""}
                                            onChange={(e) =>
                                                onFiltersChange({
                                                    ...filters,
                                                    fechaDesde: e.target.value || undefined,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <label className="text-muted-foreground">Hasta</label>
                                        <Input
                                            type="date"
                                            className="h-8"
                                            value={filters.fechaHasta ?? ""}
                                            onChange={(e) =>
                                                onFiltersChange({
                                                    ...filters,
                                                    fechaHasta: e.target.value || undefined,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => onFiltersChange({})}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 min-h-0">
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => {
                            if (isCrmTabValue(v)) onActiveTabChange(v);
                        }}
                        className="flex flex-col min-h-0"
                    >
                        <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-1 mb-2">
                            <TabsTrigger value="TODOS" className="px-2">
                                Todos ({totalRegistros})
                            </TabsTrigger>
                            <TabsTrigger value="REPORTE" className="px-2">
                                Reportes ({countsByTipo.REPORTE})
                            </TabsTrigger>
                            <TabsTrigger value="SOLICITUD" className="px-2">
                                Solicitudes ({countsByTipo.SOLICITUD})
                            </TabsTrigger>
                            <TabsTrigger value="PEDIDO" className="px-2">
                                Pedidos ({countsByTipo.PEDIDO})
                            </TabsTrigger>
                            <TabsTrigger value="RECLAMO" className="px-2">
                                Reclamos ({countsByTipo.RECLAMO})
                            </TabsTrigger>
                            <TabsTrigger value="PAGO" className="px-2">
                                Pagos ({countsByTipo.PAGO})
                            </TabsTrigger>
                            <TabsTrigger value="RESERVA" className="px-2">
                                Reservas ({countsByTipo.RESERVA})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-0">
                            <div ref={scrollAreaWrapRef}>
                                <ScrollArea className="h-[320px] rounded-md border">
                                    <Table>
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
                                                        className="h-16 text-center text-muted-foreground"
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
                                                                        className="w-full text-left truncate whitespace-nowrap leading-5 cursor-pointer hover:underline underline-offset-2"
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
                                                                        <p className="text-muted-foreground">
                                                                            Detalle completo
                                                                        </p>
                                                                    </div>

                                                                    <ScrollArea className="max-h-[260px] px-3 py-2">
                                                                        <p className="leading-relaxed whitespace-pre-wrap break-words">
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
                                                                <SelectTrigger className="h-7 w-[150px] justify-between">
                                                                    <SelectValue placeholder="Seleccionar estado" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {getEstadoOptions(r.tipo).map((estado) => (
                                                                        <SelectItem
                                                                            key={estado}
                                                                            value={estado}
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
