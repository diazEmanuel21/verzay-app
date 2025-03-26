'use client'

import { useState } from 'react'
import { UserWithPausar } from './columns'
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'


export const UserActionsMenu = ({
    user,
    onDelete,
    deletingUserId,
  }: {
    user: UserWithPausar
    onDelete: (id: string) => void
    deletingUserId: string | null
  }) =>{
    const router = useRouter()
    const [openConfirm, setOpenConfirm] = useState(false)

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>

            <DropdownMenuItem  onClick={() => router.push(`/admin/clientes/editar/${user.id}`)}>
              Editar
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push(`/admin/clientes/herramientas/${user.id}`)}>
              Herramientas
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setOpenConfirm(true)}
              className="text-red-600"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar cliente?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>¿Estás seguro de eliminar a <strong>{user.name}</strong>?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenConfirm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDelete(user.id)
                    setOpenConfirm(false)
                  }}
                  disabled={deletingUserId === user.id}
                >
                  {deletingUserId === user.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
}