"use client";

import { useMemo, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Search, Plus, MessageCircleMore } from "lucide-react";
import type {
    Session as PrismaSession,
    Registro as PrismaRegistro,
    // Cliente as PrismaCliente,
    TipoRegistro as PrismaTipoRegistro,
} from "@prisma/client";

/* ===== TIPOS ALINEADOS A PRISMA ===== */

type TipoRegistro = PrismaTipoRegistro;

type SessionWithRegistros = PrismaSession & {
    registros: PrismaRegistro[];
    // cliente?: PrismaCliente | null;
};

/* ===== HELPERS ===== */

function getStatusBadgeVariant(status: boolean) {
    return status ? "default" : "destructive";
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

function formatFecha(fecha: Date) {
    try {
        return fecha.toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return String(fecha);
    }
}

function getDisplayWhatsappFromSession(session: PrismaSession) {
    // Priorizar remoteJidAlt si quieres, por ahora usamos remoteJid
    const base = session.remoteJidAlt || session.remoteJid;
    return base.includes("@") ? base.split("@")[0] : base;
}

function getDisplayNombreFromSession(session: PrismaSession) {
    return session.pushName || "Sin nombre";
}

/* ===== COMPONENTE PRINCIPAL ===== */

export const LeadsManagement = ({
    sessions,
}: {
    sessions: SessionWithRegistros[];
}) => {
    const [search, setSearch] = useState("");
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        sessions[0]?.id ?? null
    );

    const selectedSession = useMemo(
        () => sessions.find((s) => s.id === selectedSessionId) ?? null,
        [sessions, selectedSessionId]
    );

    const filteredSessions = useMemo(() => {
        if (!search.trim()) return sessions;
        const term = search.toLowerCase();
        return sessions.filter((s) => {
            const nombre = getDisplayNombreFromSession(s).toLowerCase();
            const whatsapp = getDisplayWhatsappFromSession(s);
            const remoteJid = s.remoteJid.toLowerCase();
            const remoteJidAlt = s.remoteJidAlt?.toLowerCase() || "";
            return (
                nombre.includes(term) ||
                whatsapp.includes(search) ||
                remoteJid.includes(term) ||
                remoteJidAlt.includes(term)
            );
        });
    }, [search, sessions]);

    const registros = useMemo(() => {
        if (!selectedSession) return [] as PrismaRegistro[];
        return selectedSession.registros ?? [];
    }, [selectedSession]);

    const countByTipo = useMemo(() => {
        const counts: Record<TipoRegistro, number> = {
            REPORTE: 0,
            SOLICITUD: 0,
            PEDIDO: 0,
            RECLAMO: 0,
            PAGO: 0,
            RESERVA: 0,
        };
        for (const r of registros) {
            counts[r.tipo] = (counts[r.tipo] ?? 0) + 1;
        }
        return counts;
    }, [registros]);

    const selectedWhatsapp = selectedSession
        ? getDisplayWhatsappFromSession(selectedSession)
        : "";

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header principal */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Leads / Sesiones
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Visualiza los leads (sessiones) y su historial de registros
                        (reportes, solicitudes, pedidos, reclamos, pagos y reservas).
                    </p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                    {/* Las sesiones vienen del webhook, por eso no hay botón de "Nuevo lead" */}
                    <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Nuevo registro
                    </Button>
                </div>
            </div>

            {/* Layout principal */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] h-[calc(100vh-9rem)]">
                {/* Columna izquierda: Sesiones / Leads */}
                <Card className="flex flex-col min-h-0 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Leads (Sesiones)</CardTitle>
                        <CardDescription className="text-xs">
                            Todas las sessiones activas/inactivas con historial de CRM.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 min-h-0">
                        {/* Buscador */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8 h-8 text-xs"
                                    placeholder="Buscar por nombre, número o JID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Lista de leads */}
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-1 pr-2">
                                {filteredSessions.length === 0 && (
                                    <p className="text-xs text-muted-foreground py-4 text-center">
                                        No se encontraron leads para &quot;{search}&quot;.
                                    </p>
                                )}

                                {filteredSessions.map((session) => {
                                    const isSelected = session.id === selectedSessionId;
                                    const displayNombre = getDisplayNombreFromSession(session);
                                    const displayWhatsapp = getDisplayWhatsappFromSession(session);
                                    // const hasCliente = !!session.cliente;

                                    return (
                                        <button
                                            key={session.id}
                                            type="button"
                                            onClick={() => setSelectedSessionId(session.id)}
                                            className={[
                                                "w-full text-left rounded-lg px-3 py-2 border flex flex-col gap-1 transition text-xs",
                                                "hover:bg-accent/60 hover:border-accent",
                                                isSelected
                                                    ? "bg-accent border-accent"
                                                    : "bg-background border-border",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium truncate">
                                                    {displayNombre}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {/* {hasCliente && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[9px] px-1 py-0"
                                                        >
                                                            Cliente
                                                        </Badge>
                                                    )} */}
                                                    <Badge
                                                        variant={getStatusBadgeVariant(session.status) as any}
                                                        className="text-[10px] px-1.5 py-0"
                                                    >
                                                        {session.status ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                                                <span className="truncate">{displayWhatsapp}</span>
                                                <span className="truncate">
                                                    {session.remoteJid}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Columna derecha: Detalle de lead + registros */}
                <Card className="flex flex-col border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {selectedSession
                                ? getDisplayNombreFromSession(selectedSession)
                                : "Selecciona un lead"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {selectedSession
                                ? "Detalle del lead (Session) y actividad de CRM asociada."
                                : "Haz clic en un lead de la izquierda para ver el detalle."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 min-h-0">
                        {selectedSession ? (
                            <>
                                {/* Info rápida del lead */}
                                <div className="flex flex-col gap-2 rounded-lg border-border bg-muted/40 p-3 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium">
                                                {getDisplayNombreFromSession(selectedSession)}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {getDisplayWhatsappFromSession(selectedSession)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* {selectedSession.cliente && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-1.5 py-0"
                                                >
                                                    Vinculado a Cliente
                                                </Badge>
                                            )} */}
                                            <Badge
                                                variant={getStatusBadgeVariant(selectedSession.status) as any}
                                                className="text-[10px] px-1.5 py-0"
                                            >
                                                {selectedSession.status ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] text-muted-foreground">
                                                remoteJid
                                            </span>
                                            <span className="text-[11px]">
                                                {selectedSession.remoteJid}
                                            </span>
                                        </div>
                                        {selectedSession.remoteJidAlt && (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] text-muted-foreground">
                                                    remoteJidAlt
                                                </span>
                                                <span className="text-[11px]">
                                                    {selectedSession.remoteJidAlt}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] text-muted-foreground">
                                                Creado
                                            </span>
                                            <span className="text-[11px]">
                                                {formatFecha(selectedSession.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="outline" className="h-7 w-7">
                                                <MessageCircleMore className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs de registros */}
                                <Tabs defaultValue="RESUMEN" className="flex flex-col min-h-0">
                                    <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-1 mb-2">
                                        <TabsTrigger value="RESUMEN" className="text-[11px] px-2">
                                            Resumen
                                        </TabsTrigger>
                                        <TabsTrigger value="REPORTE" className="text-[11px] px-2">
                                            Reportes{" "}
                                            {countByTipo.REPORTE > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.REPORTE})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="SOLICITUD" className="text-[11px] px-2">
                                            Solicitudes{" "}
                                            {countByTipo.SOLICITUD > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.SOLICITUD})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="PEDIDO" className="text-[11px] px-2">
                                            Pedidos{" "}
                                            {countByTipo.PEDIDO > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.PEDIDO})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="RECLAMO" className="text-[11px] px-2">
                                            Reclamos{" "}
                                            {countByTipo.RECLAMO > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.RECLAMO})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="PAGO" className="text-[11px] px-2">
                                            Pagos{" "}
                                            {countByTipo.PAGO > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.PAGO})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="RESERVA" className="text-[11px] px-2">
                                            Reservas{" "}
                                            {countByTipo.RESERVA > 0 && (
                                                <span className="ml-1 text-[10px] text-muted-foreground">
                                                    ({countByTipo.RESERVA})
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* TAB RESUMEN */}
                                    <TabsContent
                                        value="RESUMEN"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <ScrollArea className="flex-1 rounded-md ">
                                            {/* <ScrollArea className="h-[260px] md:h-[320px] pr-2"> */}
                                            <div className="flex flex-col gap-3 text-xs">
                                                <div>
                                                    <p className="font-medium mb-1">Resumen general</p>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        Este lead representa una session de WhatsApp y aquí
                                                        ves toda su actividad: reportes, solicitudes,
                                                        pedidos, reclamos, pagos y reservas.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    <ResumeCard
                                                        label="Reportes"
                                                        value={countByTipo.REPORTE}
                                                    />
                                                    <ResumeCard
                                                        label="Solicitudes"
                                                        value={countByTipo.SOLICITUD}
                                                    />
                                                    <ResumeCard
                                                        label="Pedidos"
                                                        value={countByTipo.PEDIDO}
                                                    />
                                                    <ResumeCard
                                                        label="Reclamos"
                                                        value={countByTipo.RECLAMO}
                                                    />
                                                    <ResumeCard label="Pagos" value={countByTipo.PAGO} />
                                                    <ResumeCard
                                                        label="Reservas"
                                                        value={countByTipo.RESERVA}
                                                    />
                                                </div>

                                                <Separator className="my-1" />

{/* TODO: DESCOMENTAR FECHAAA */}
                                                {/* <div>
                                                    <p className="font-medium mb-1">
                                                        Actividad reciente
                                                    </p>
                                                    {registros.length === 0 ? (
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Este lead aún no tiene registros.
                                                        </p>
                                                    ) : (
                                                        <ul className="flex flex-col gap-1">
                                                            {registros
                                                                .slice()
                                                                .sort((a, b) =>
                                                                    a.fecha < b.fecha ? 1 : -1
                                                                )
                                                                .slice(0, 5)
                                                                .map((r) => (
                                                                    <li
                                                                        key={r.id}
                                                                        className="flex items-start justify-between gap-2 rounded-md border bg-background px-2 py-1.5"
                                                                    >
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[11px] font-medium">
                                                                                {getTipoLabel(r.tipo)}
                                                                            </span>
                                                                            <span className="text-[11px] text-muted-foreground line-clamp-2">
                                                                                {r.resumen || r.detalles || "Sin detalles"}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                                            {formatFecha(r.fecha)}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                        </ul>
                                                    )}
                                                </div> */}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>

                                    {/* TAB POR TIPO */}
                                    <TabsContent
                                        value="REPORTE"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="REPORTE"
                                            registros={registros.filter(
                                                (r) => r.tipo === "REPORTE"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="SOLICITUD"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="SOLICITUD"
                                            registros={registros.filter(
                                                (r) => r.tipo === "SOLICITUD"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="PEDIDO"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="PEDIDO"
                                            registros={registros.filter(
                                                (r) => r.tipo === "PEDIDO"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="RECLAMO"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="RECLAMO"
                                            registros={registros.filter(
                                                (r) => r.tipo === "RECLAMO"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="PAGO"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="PAGO"
                                            registros={registros.filter(
                                                (r) => r.tipo === "PAGO"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="RESERVA"
                                        className="flex-1 min-h-0 mt-0"
                                    >
                                        <RegistrosTable
                                            tipo="RESERVA"
                                            registros={registros.filter(
                                                (r) => r.tipo === "RESERVA"
                                            )}
                                            whatsapp={selectedWhatsapp}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">
                                    Selecciona un lead en la columna izquierda para ver el
                                    detalle.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

/* ===== SUBCOMPONENTES ===== */

function ResumeCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border bg-background px-3 py-2 flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
        </div>
    );
}

function RegistrosTable({
    tipo,
    registros,
    whatsapp,
}: {
    tipo: TipoRegistro;
    registros: PrismaRegistro[];
    whatsapp: string;
}) {
    const isReporte = tipo === "REPORTE";

    return (
        <div className="flex flex-col gap-2 h-[260px] md:h-[320px]">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">
                    {getTipoLabel(tipo)} ({registros.length})
                </p>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo {getTipoLabel(tipo).slice(0, -1)}
                </Button>
            </div>

            <ScrollArea className="flex-1 rounded-md border">
                <Table className="text-xs">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-8 py-1.5">Fecha</TableHead>
                            <TableHead className="h-8 py-1.5">WhatsApp</TableHead>
                            {isReporte && (
                                <>
                                    <TableHead className="h-8 py-1.5">Nombre</TableHead>
                                    <TableHead className="h-8 py-1.5">Resumen</TableHead>
                                    <TableHead className="h-8 py-1.5 text-center">Lead</TableHead>
                                </>
                            )}
                            {!isReporte && (
                                <TableHead className="h-8 py-1.5">Detalles</TableHead>
                            )}
                            <TableHead className="h-8 py-1.5 text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registros.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={isReporte ? 6 : 4}
                                    className="h-16 text-center text-[11px] text-muted-foreground"
                                >
                                    No hay registros para este módulo.
                                </TableCell>
                            </TableRow>
                        )}

                        {registros.map((r) => (
                            <TableRow key={r.id} className="hover:bg-accent/40">
                                <TableCell className="py-1.5 align-top whitespace-nowrap">
                                    {/* {formatFecha(r.fecha)}  TODO: DESCOMENTAR FECHA */}
                                </TableCell>
                                <TableCell className="py-1.5 align-top whitespace-nowrap">
                                    {whatsapp}
                                </TableCell>

                                {isReporte ? (
                                    <>
                                        <TableCell className="py-1.5 align-top whitespace-nowrap">
                                            {r.nombre || "-"}
                                        </TableCell>
                                        <TableCell className="py-1.5 align-top max-w-[220px]">
                                            <span className="line-clamp-2">
                                                {r.resumen || "Sin resumen"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-1.5 align-top text-center">
                                            {r.lead ? (
                                                <Badge
                                                    variant="default"
                                                    className="text-[10px] px-2 py-0"
                                                >
                                                    Sí
                                                </Badge>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">
                                                    No
                                                </span>
                                            )}
                                        </TableCell>
                                    </>
                                ) : (
                                    <TableCell className="py-1.5 align-top max-w-[260px]">
                                        <span className="line-clamp-2">
                                            {r.detalles || "Sin detalles"}
                                        </span>
                                    </TableCell>
                                )}

                                <TableCell className="py-1.5 align-top text-right">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-2 py-0 capitalize"
                                    >
                                        {r.estado}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
