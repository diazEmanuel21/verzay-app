'use client'

import { ColumnDef } from '@tanstack/react-table'
import { UserActionsMenu } from './user-actions-menu'
import { DialogType } from './clients-manager'
import { ClientInterface } from '@/lib/types'
import { StatusCell } from '@/components/StatusCell'
import { ArrowUpDown, XCircleIcon } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'

export const getColumns = (openDialogGetUserId: (userId: string, dialog: DialogType, state: boolean) => void, currentUserRol: string): ColumnDef<ClientInterface>[] => [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'company',
    header: 'Marca',
  },
  {
    accessorKey: 'isEvoEnabled',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-sm"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StatusCell isEvoEnabled={row.original.isEvoEnabled} />,
  },
  // {
  //   accessorKey: 'messagePause',
  //   header: 'Frase',
  //   cell: ({ row }) => (
  //     <span className="italic text-muted-foreground text-sm">
  //       {row.original.pausar.filter(pausas => pausas.tipo === 'abrir')[0]?.mensaje || '—'}
  //     </span>
  //   ),
  // },
  {
    accessorKey: 'webhookUrl',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-sm"
      >
        Webhook
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const url = row.original.webhookUrl;

      if (url?.startsWith("https://n8npro.verzay.co/webhook/")) {
        return <Badge className="bg-green-600 text-white">Avanzado</Badge>;
      }

      if (url?.startsWith("http://82.29.152.30:4001/webhook")) {
        return <Badge className="bg-blue-500 text-white">Estándar</Badge>;
      }

      return <Badge variant="outline">—</Badge>;
    },
  },
  {
    accessorKey: 'Creditos',
    header: 'Creditos',
  },
  {
    id: 'acciones',
    enableHiding: false,
    cell: ({ row }) => (
      <UserActionsMenu
        currentUserRol={currentUserRol}
        user={row.original}
        openDialogGetUserId={openDialogGetUserId}
      />
    )
  }
]