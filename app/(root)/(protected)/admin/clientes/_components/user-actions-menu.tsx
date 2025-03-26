'use client'

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
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export const UserActionsMenu = ({
    user,
    openDialogGetUserId
}: {
    user: UserWithPausar
    openDialogGetUserId: (userId: string, state: boolean) => void
}) => {
    const router = useRouter()
    const handleOpenDialog = () => openDialogGetUserId(user.id, true);

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

                    <DropdownMenuItem onClick={() => toast.info('En contrucción...')} >
                        Editar
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => toast.info('En contrucción...')}>
                        Herramientas
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => handleOpenDialog()}
                        className="text-red-600"
                    >
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}