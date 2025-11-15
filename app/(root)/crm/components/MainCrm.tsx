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
import { Search, Plus, MessageCircleMore, Mail } from "lucide-react";

type ClienteEstado = "ACTIVO" | "INACTIVO" | "PROSPECTO" | "VIP" | string;

type Cliente = {
  id: string;
  whatsapp: string;
  nombre: string;
  empresa?: string;
  correo?: string;
  detalles?: string;
  estado: ClienteEstado;
};

type TipoRegistro =
  | "REPORTE"
  | "SOLICITUD"
  | "PEDIDO"
  | "RECLAMO"
  | "PAGO"
  | "RESERVA";

type Registro = {
  id: string;
  tipo: TipoRegistro;
  whatsapp: string;
  fecha: string; // para demo, string legible
  estado: string;
  // campos específicos según tipo
  resumen?: string; // Reportes
  nombre?: string; // Reportes
  lead?: boolean; // Reportes
  detalles?: string; // Solicitudes / Pedidos / Reclamos / Pagos / Reservas
};

// ------------ MOCK DATA (solo para UI / demo) ------------

const mockClientes: Cliente[] = [
  {
    id: "1",
    whatsapp: "573001112233",
    nombre: "Juan Pérez",
    empresa: "Verzay",
    correo: "juan@cliente.com",
    detalles: "Cliente interesado en agentes IA para WhatsApp.",
    estado: "ACTIVO",
  },
  {
    id: "2",
    whatsapp: "573009998877",
    nombre: "María López",
    empresa: "Holi Print RD",
    correo: "maria@holiprint.com",
    detalles: "Solicitó información sobre automatización de cotizaciones.",
    estado: "PROSPECTO",
  },
  {
    id: "3",
    whatsapp: "584147778899",
    nombre: "Carlos García",
    empresa: "Zabdi Servicios Exprés",
    correo: "carlos@zabdi.com",
    detalles: "En pruebas de CRM y agendamiento.",
    estado: "VIP",
  },
  {
    id: "4",
    whatsapp: "573251452125",
    nombre: "Carlos Arcos",
    empresa: "Verzay",
    correo: "carlos@verzay.com",
    detalles: "En pruebas de CRM y agendamiento.",
    estado: "VIP",
  },
  {
    id: "5",
    whatsapp: "1120256041",
    nombre: "Alex Rouse",
    empresa: "Telecom SA",
    correo: "paul.d@telecom.com",
    detalles: "Solicitó información sobre automatización de cotizaciones.",
    estado: "ACTIVO",
  },
  {
    id: "6",
    whatsapp: "573145625458",
    nombre: "Pedro Kappo",
    empresa: "W Sound",
    correo: "kappoo@wsound.com",
    detalles: "En pruebas de CRM y agendamiento.",
    estado: "PROSPECTO",
  },
  {
    id: "7",
    whatsapp: "5754215458",
    nombre: "Bryan Myers",
    empresa: "PR INC",
    correo: "carlos@zabdi.com",
    detalles: "En pruebas de CRM y agendamiento.",
    estado: "PROSPECTO",
  },
];

const mockRegistros: Registro[] = [
  {
    id: "r1",
    tipo: "REPORTE",
    whatsapp: "573001112233",
    fecha: "2025-11-10 09:30",
    estado: "Abierto",
    nombre: "Juan Pérez",
    resumen: "Reporta problema con integración de WhatsApp.",
    lead: true,
  },
  {
    id: "r2",
    tipo: "SOLICITUD",
    whatsapp: "573001112233",
    fecha: "2025-11-11 14:20",
    estado: "En proceso",
    detalles: "Solicitud de demo para IA en WhatsApp.",
  },
  {
    id: "r3",
    tipo: "PEDIDO",
    whatsapp: "573001112233",
    fecha: "2025-11-12 10:05",
    estado: "Pagado",
    detalles: "Pedido de agente IA personalizado (plan Pro).",
  },
  {
    id: "r4",
    tipo: "RECLAMO",
    whatsapp: "573009998877",
    fecha: "2025-11-13 16:40",
    estado: "Pendiente",
    detalles: "No recibe notificaciones en el CRM.",
  },
  {
    id: "r5",
    tipo: "PAGO",
    whatsapp: "573001112233",
    fecha: "2025-11-12 11:00",
    estado: "Confirmado",
    detalles: "Pago por suscripción mensual.",
  },
  {
    id: "r6",
    tipo: "RESERVA",
    whatsapp: "584147778899",
    fecha: "2025-11-14 15:00",
    estado: "Reservado",
    detalles: "Reserva de sesión de onboarding.",
  },
];

// ------------ HELPERS UI ------------

function getEstadoBadgeVariant(estado: ClienteEstado | string) {
  const e = estado.toString().toUpperCase();
  if (e === "ACTIVO") return "default";
  if (e === "PROSPECTO") return "outline";
  if (e === "VIP") return "secondary";
  if (e === "INACTIVO") return "destructive";
  return "outline";
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

// ------------ COMPONENTES PRINCIPALES ------------

export const MainCrm = () => {
  const [search, setSearch] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    mockClientes[0]?.id ?? null
  );

  const selectedCliente = useMemo(
    () => mockClientes.find((c) => c.id === selectedClienteId) ?? null,
    [selectedClienteId]
  );

  const filteredClientes = useMemo(() => {
    if (!search.trim()) return mockClientes;
    const term = search.toLowerCase();
    return mockClientes.filter((c) => {
      return (
        c.nombre.toLowerCase().includes(term) ||
        c.whatsapp.includes(search) ||
        c.empresa?.toLowerCase().includes(term) ||
        c.correo?.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const registrosCliente = useMemo(() => {
    if (!selectedCliente) return [];
    return mockRegistros.filter(
      (r) => r.whatsapp === selectedCliente.whatsapp
    );
  }, [selectedCliente]);

  const countByTipo = useMemo(() => {
    const counts: Record<TipoRegistro, number> = {
      REPORTE: 0,
      SOLICITUD: 0,
      PEDIDO: 0,
      RECLAMO: 0,
      PAGO: 0,
      RESERVA: 0,
    };
    for (const r of registrosCliente) {
      counts[r.tipo] = (counts[r.tipo] ?? 0) + 1;
    }
    return counts;
  }, [registrosCliente]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header principal */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM de WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona clientes, reportes, solicitudes, pedidos, reclamos, pagos y
            reservas en una vista unificada.
          </p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo cliente
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo registro
          </Button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] h-[calc(100vh-9rem)]">
        {/* Columna izquierda: Clientes */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Clientes</CardTitle>
            <CardDescription className="text-xs">
              Lista de contactos vinculados a WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 min-h-0">
            {/* Buscador */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-xs"
                  placeholder="Buscar por nombre, WhatsApp, empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Lista de clientes */}
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 pr-2">
                {filteredClientes.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No se encontraron clientes para &quot;{search}&quot;.
                  </p>
                )}

                {filteredClientes.map((cliente) => {
                  const isSelected = cliente.id === selectedClienteId;
                  return (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => setSelectedClienteId(cliente.id)}
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
                          {cliente.nombre}
                        </span>
                        <Badge
                          variant={getEstadoBadgeVariant(cliente.estado) as any}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {cliente.estado}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                        <span className="truncate">
                          {cliente.empresa || "Sin empresa"}
                        </span>
                        <span className="truncate">{cliente.whatsapp}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Columna derecha: Detalle cliente + registros */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedCliente ? selectedCliente.nombre : "Selecciona un cliente"}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedCliente
                ? "Resumen del cliente, actividad y registros relacionados."
                : "Haz clic en un cliente de la izquierda para ver el detalle."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 min-h-0">
            {selectedCliente ? (
              <>
                {/* Info rápida del cliente */}
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium">
                        {selectedCliente.nombre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {selectedCliente.empresa || "Sin empresa registrada"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          getEstadoBadgeVariant(selectedCliente.estado) as any
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {selectedCliente.estado}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        WhatsApp
                      </span>
                      <span className="text-xs">{selectedCliente.whatsapp}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        Correo
                      </span>
                      <span className="text-xs">
                        {selectedCliente.correo || "Sin correo"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7">
                        <MessageCircleMore className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7">
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {selectedCliente.detalles && (
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {selectedCliente.detalles}
                    </p>
                  )}
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
                    <ScrollArea className="h-[260px] md:h-[320px] pr-2">
                      <div className="flex flex-col gap-3 text-xs">
                        <div>
                          <p className="font-medium mb-1">Resumen general</p>
                          <p className="text-muted-foreground text-[11px]">
                            Aquí puedes ver de forma rápida la actividad del
                            cliente en todos los módulos: reportes, solicitudes,
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

                        <div>
                          <p className="font-medium mb-1">
                            Actividad reciente
                          </p>
                          {registrosCliente.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">
                              Este cliente aún no tiene registros asociados.
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-1">
                              {registrosCliente
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
                                      {r.fecha}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
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
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "REPORTE"
                      )}
                    />
                  </TabsContent>

                  <TabsContent
                    value="SOLICITUD"
                    className="flex-1 min-h-0 mt-0"
                  >
                    <RegistrosTable
                      tipo="SOLICITUD"
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "SOLICITUD"
                      )}
                    />
                  </TabsContent>

                  <TabsContent
                    value="PEDIDO"
                    className="flex-1 min-h-0 mt-0"
                  >
                    <RegistrosTable
                      tipo="PEDIDO"
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "PEDIDO"
                      )}
                    />
                  </TabsContent>

                  <TabsContent
                    value="RECLAMO"
                    className="flex-1 min-h-0 mt-0"
                  >
                    <RegistrosTable
                      tipo="RECLAMO"
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "RECLAMO"
                      )}
                    />
                  </TabsContent>

                  <TabsContent
                    value="PAGO"
                    className="flex-1 min-h-0 mt-0"
                  >
                    <RegistrosTable
                      tipo="PAGO"
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "PAGO"
                      )}
                    />
                  </TabsContent>

                  <TabsContent
                    value="RESERVA"
                    className="flex-1 min-h-0 mt-0"
                  >
                    <RegistrosTable
                      tipo="RESERVA"
                      registros={registrosCliente.filter(
                        (r) => r.tipo === "RESERVA"
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Selecciona un cliente en la columna izquierda para ver el
                  detalle.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ------------ SUBCOMPONENTES ------------

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
}: {
  tipo: TipoRegistro;
  registros: Registro[];
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
                  {r.fecha}
                </TableCell>
                <TableCell className="py-1.5 align-top whitespace-nowrap">
                  {r.whatsapp}
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
