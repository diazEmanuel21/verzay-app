'use client'

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
import { DialogType } from './clients-manager'
import { UserWithPausar } from '@/lib/types'

interface propsActionsMenu {
    currentUserRol: string
    user: UserWithPausar
    openDialogGetUserId: (userId: string, dialog: DialogType, state: boolean) => void
}

/* El user es el usuario seleccionado de la tabla y el currentUserRol es el usuario logueado */
export const UserActionsMenu = ({ user, openDialogGetUserId, currentUserRol }: propsActionsMenu) => {
    return (
        <>
            {currentUserRol === 'admin' &&
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => openDialogGetUserId(user.id, 'editar', true)}
                        >
                            Editar
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => openDialogGetUserId(user.id, 'tools', true,)}
                        >
                            Herramientas
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => openDialogGetUserId(user.id, 'delete', true)}
                            className="text-red-600"
                        >
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        </>
    )
}