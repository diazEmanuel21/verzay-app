'use client'

import { ColumnDef } from '@tanstack/react-table'
import { User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type UserWithPausar = User & {
  pausarMensaje?: string
}

export const getColumns = (
  handleEdit: (userId: string, formData: FormData) => void,
  handleDelete: (userId: string) => void,
  deletingUserId: string | null
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
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                const formData = new FormData()
                formData.append('name', user.name || '')
                formData.append('email', user.email)
                formData.append('password', user.password || '')
                handleEdit(user.id, formData)
              }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]