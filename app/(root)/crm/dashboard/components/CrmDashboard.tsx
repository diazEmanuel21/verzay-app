"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { BarChart3, Activity, Users, Filter } from "lucide-react";
import { TagStatsCard } from './TagStatsCard';
import type {
    Registro as PrismaRegistro,
    Session as PrismaSession,
    // Cliente as PrismaCliente,
    TipoRegistro as PrismaTipoRegistro,
} from "@prisma/client";

// Si usas Recharts:
// npm i recharts
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

/* ===== TIPOS ALINEADOS A PRISMA ===== */

type TipoRegistro = PrismaTipoRegistro;

export type RegistroWithSession = PrismaRegistro
/* ===== HELPERS ===== */

function toDate(v: Date | string): Date {
    return v instanceof Date ? v : new Date(v);
}

function formatFecha(v: Date | string) {
    const d = toDate(v);
    try {
        return d.toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return d.toISOString();
    }
}

function getTipoLabel(tipo: TipoRegistro) {
    switch (tipo) {
        case "REPORTE":
            return "Reportes";
        case "SOLICITUD":
            return "Solicitudes";
        case "PEDIDO":
            return "Pedidos";
        case "RECLAMO":
            return "Reclamos";
        case "PAGO":
            return "Pagos";
        case "RESERVA":
            return "Reservas";
        default:
            return tipo;
    }
}

const ESTADOS_POR_TIPO: Record<TipoRegistro, string[]> = {
    REPORTE: [
        "Habilitado",
        "Inhabilitado",
    ],
    SOLICITUD: [
        "Pendiente",
        "Procesando",
        "Confirmado",
        "Cancelado",
    ],
    PEDIDO: [
        "Pendiente",
        "Procesando",
        "Despachado",
        "En tránsito",
        "Entregado",
        "Cancelado",
    ],
    RESERVA: [
        "Pendiente",
        "Procesando",
        "Confirmada",
        "Cancelada",
    ],
    RECLAMO: [
        "Pendiente",
        "Procesando",
        "Solucionado",
        "Cancelado",
    ],
    PAGO: [
        "Pendiente",
        "Procesando",
        "Confirmado",
        "Cancelado",
    ],
};

function getEstadoOptions(tipo: TipoRegistro): string[] {
    return ESTADOS_POR_TIPO[tipo] ?? [];
}


function getDisplayWhatsappFromSession(session: PrismaSession) {
    const base = session.remoteJidAlt || session.remoteJid;
    return base.includes("@") ? base.split("@")[0] : base;
}

function getDisplayNombreFromRegistro(r: RegistroWithSession) {
    return (
        // r.session.cliente?.nombre ||
        r.nombre || // snapshot en Registro
        "Sin nombre"
    );
}

/* ===== COMPONENTE PRINCIPAL ===== */

export const CrmDashboard = ({
    registros,
    onChangeEstado,
    userId
}: {
    registros: RegistroWithSession[];
    onChangeEstado?: (registroId: number, nuevoEstado: string) => void;
    userId: string
}) => {
    const [activeTab, setActiveTab] = useState<
        "TODOS" | TipoRegistro
    >("TODOS");

    // --- Métricas base ---
    const totalRegistros = registros.length;

    const leadsConMovimientos = useMemo(() => {
        const set = new Set<number>();
        for (const r of registros) set.add(r.sessionId);
        return set.size;
    }, [registros]);

    // const clientesConMovimientos = useMemo(() => {
    //     const set = new Set<string>();
    //     for (const r of registros) {
    //         if (r.session.cliente?.id) set.add(r.session.cliente.id);
    //     }
    //     return set.size;
    // }, [registros]);

    // --- Registros por tipo ---
    const countsByTipo = useMemo(() => {
        const base: Record<TipoRegistro, number> = {
            REPORTE: 0,
            SOLICITUD: 0,
            PEDIDO: 0,
            RECLAMO: 0,
            PAGO: 0,
            RESERVA: 0,
        };
        for (const r of registros) {
            base[r.tipo] = (base[r.tipo] ?? 0) + 1;
        }
        return base;
    }, [registros]);

    const chartDataByTipo = useMemo(
        () =>
            (Object.keys(countsByTipo) as TipoRegistro[]).map((tipo) => ({
                tipo: getTipoLabel(tipo),
                cantidad: countsByTipo[tipo],
            })),
        [countsByTipo]
    );

    // --- Registros últimos 7 días ---
    const chartDataByDay = useMemo(() => {
        const now = new Date();
        const daysMap = new Map<string, number>(); // key: yyyy-MM-dd

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            daysMap.set(key, 0);
        }

        for (const r of registros) {
            const d = toDate(r.fecha || '');
            const key = d.toISOString().slice(0, 10);
            if (daysMap.has(key)) {
                daysMap.set(key, (daysMap.get(key) ?? 0) + 1);
            }
        }

        return Array.from(daysMap.entries()).map(([key, count]) => ({
            fecha: key.slice(5), // MM-DD
            cantidad: count,
        }));
    }, [registros]);

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
                    // value={(leadsConMovimientos - clientesConMovimientos)}
                    value={(leadsConMovimientos)}
                    helper="Sessiones que tienen al menos un registro"
                />
                {/* <h1>client1es con movimientos, se calcula con el tag</h1> */}
                {/* <MetricCard
                    icon={<Users className="h-4 w-4" />}
                    label="Clientes con movimientos"
                    value={clientesConMovimientos}
                    helper="Clientes vinculados a sessiones con registros"
                /> */}
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
            <TagStatsCard userId={userId} />


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
                                            {/* <TableHead className="h-8 py-1.5 whitespace-nowrap">
                                                Tipo
                                            </TableHead> */}
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
                                            // const whatsapp = getDisplayWhatsappFromSession(
                                            //     r.session
                                            // );
                                            const nombre = getDisplayNombreFromRegistro(r);
                                            const tipoLabel = getTipoLabel(r.tipo);
                                            const detalle =
                                                r.resumen || r.detalles || "Sin detalles";

                                            return (
                                                <TableRow key={r.id} className="hover:bg-accent/40">
                                                    <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                        {/* {whatsapp} - corregir consulta */}
                                                        corregir consulta
                                                    </TableCell>
                                                    <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                        {nombre}
                                                    </TableCell>
                                                    <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                        {formatFecha(r.fecha || '')}
                                                    </TableCell>
                                                    {/* <TableCell className="py-1.5 align-top whitespace-nowrap">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] px-2 py-0"
                                                        >
                                                            {tipoLabel}
                                                        </Badge>
                                                    </TableCell> */}
                                                    <TableCell className="py-1.5 align-top max-w-[280px]">
                                                        <span className="line-clamp-2">{detalle}</span>
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
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

/* ===== SUBCOMPONENTES ===== */

function MetricCard({
    icon,
    label,
    value,
    helper,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    helper?: string;
}) {
    return (
        <Card className="border-border bg-background/60">
            <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <div className="h-7 w-7 rounded-full border flex items-center justify-center text-muted-foreground">
                        {icon}
                    </div>
                </div>
                <div className="text-xl font-semibold leading-none">{value}</div>
                {helper && (
                    <p className="text-[11px] text-muted-foreground">{helper}</p>
                )}
            </CardContent>
        </Card>
    );
}