import { Registro, TipoRegistro } from "@prisma/client";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { formatFecha, getTipoLabel } from "../helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const RegistrosTable =({
    tipo,
    registros,
    whatsapp,
}: {
    tipo: TipoRegistro;
    registros: Registro[];
    whatsapp: string;
}) => {
    const isReporte = tipo === "REPORTE";

    return (
        <div className="flex flex-col gap-2 h-[260px] sm:h-[300px] md:h-[320px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                    {getTipoLabel(tipo)} ({registros.length})
                </p>
                <Button variant="outline" size="sm" className="h-7 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo {getTipoLabel(tipo).slice(0, -1)}
                </Button>
            </div>

            <ScrollArea className="flex-1 rounded-md border">
                <div className="min-w-[640px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-8 py-1.5">Fecha</TableHead>
                                <TableHead className="h-8 py-1.5">WhatsApp</TableHead>
                                {isReporte && (
                                    <>
                                        <TableHead className="h-8 py-1.5">Nombre</TableHead>
                                        <TableHead className="h-8 py-1.5">Resumen</TableHead>
                                        <TableHead className="h-8 py-1.5 text-center">
                                            Lead
                                        </TableHead>
                                    </>
                                )}
                                {!isReporte && (
                                    <TableHead className="h-8 py-1.5">Detalles</TableHead>
                                )}
                                <TableHead className="h-8 py-1.5 text-right">
                                    Estado
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registros.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={isReporte ? 6 : 4}
                                        className="h-16 text-center text-muted-foreground"
                                    >
                                        No hay registros para este módulo.
                                    </TableCell>
                                </TableRow>
                            )}

                            {registros.map((r) => (
                                <TableRow key={r.id} className="hover:bg-accent/40">
                                    <TableCell className="py-1.5 align-top whitespace-nowrap">
                                        {formatFecha(r.fecha || undefined)}
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
                                                        className="px-2 py-0"
                                                    >
                                                        Sí
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">
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
                                            className="px-2 py-0 capitalize"
                                        >
                                            {r.estado}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    );
}