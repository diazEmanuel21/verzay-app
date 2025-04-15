'use client'

import { ColumnDef } from '@tanstack/react-table'
import { UserActionsMenu } from './user-actions-menu'
import { DialogType } from './clients-manager'
import { UserWithPausar } from '@/lib/types'


export const getColumns = (openDialogGetUserId: (userId: string, dialog: DialogType, state: boolean) => void, currentUserRol: string): ColumnDef<UserWithPausar>[] => [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'pausarMensaje',
    header: 'Frase',
    cell: ({ row }) => (
      <span className="italic text-muted-foreground text-sm">
        {row.original.pausar.filter(pausas => pausas.tipo === 'abrir')[0]?.mensaje || '—'}
      </span>
    ),
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