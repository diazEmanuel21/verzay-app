"use client"

import {
    ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Session } from "@prisma/client"
import { SwitchStatus } from "./SwitchStatus"
import { toast } from "sonner"
import { DialogSessionType } from "./MainSession"

export const getColumns = (openDeleteDialog: (sessionId: number, remoteJid: string, userId: string, dialog: DialogSessionType) => void): ColumnDef<Session>[] => [
    // {
    //     id: "select",
    //     header: ({ table }) => (
    //         <Checkbox
    //             checked={
    //                 table.getIsAllPageRowsSelected() ||
    //                 (table.getIsSomePageRowsSelected() && "indeterminate")
    //             }
    //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //             aria-label="Select all"
    //         />
    //     ),
    //     cell: ({ row }) => (
    //         <Checkbox
    //             checked={row.getIsSelected()}
    //             onCheckedChange={(value) => row.toggleSelected(!!value)}
    //             aria-label="Select row"
    //         />
    //     ),
    //     enableSorting: false,
    //     enableHiding: false,
    // },
    {
        accessorKey: "id",
        header: "ID",
        enableHiding: true,
        meta: { shouldShow: false }
    },
    {
        accessorKey: "userId",
        header: "Usuario",
        enableHiding: true,
        meta: { shouldShow: false }
    },
    {
        accessorKey: "remoteJid",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Teléfono
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => {
            const remoteJid = row.getValue("remoteJid") as string;
            const phone = remoteJid.split('@')[0];
            /* Obtener pais con base al indicativo */
            // const country = getCountryByPhone(phone.toString());
            return (
                <div className="capitalize">{phone}</div>
            )
        },
    },
    {
        accessorKey: "pushName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div className="capitalize">{row.getValue("pushName")}</div>,
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Estado
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as boolean;
            const sessionId = row.original.id as number;

            return (
                <SwitchStatus
                    checked={status}
                    sessionId={sessionId}
                />
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fecha de ingreso
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date;

            const formattedDate = new Intl.DateTimeFormat('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(new Date(date));

            return <div>{formattedDate}</div>;
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const sessionId = row.getValue("id") as number;
            const userId = row.getValue("userId") as string;
            const remoteJid = row.getValue("remoteJid") as string;
            const phone = remoteJid.split('@')[0];
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => openDeleteDialog(sessionId, remoteJid, userId, 'deleteConversation')}
                            className="text-red-600"
                        >
                            Eliminar historial de conversación
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => openDeleteDialog(sessionId, remoteJid, userId, 'deleteClient')}
                            className="text-red-600"
                        >
                            Eliminar cliente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]