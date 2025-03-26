'use client'

import { ColumnDef } from '@tanstack/react-table'
import { User } from '@prisma/client'
import { UserActionsMenu } from './user-actions-menu'
import { DialogType } from './clients-manager'

export type UserWithPausar = User & {
  pausarMensaje?: string
}

export const getColumns = (
  openDialogGetUserId: (userId: string, dialog: DialogType, state: boolean) => void
): ColumnDef<UserWithPausar>[] => [
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
          {row.original.pausarMensaje || '—'}
        </span>
      ),
    },
    {
      id: 'acciones',
      enableHiding: false,
      cell: ({ row }) => (
        <UserActionsMenu
          user={row.original}
          openDialogGetUserId={openDialogGetUserId}
        />
      )
    }
  ]