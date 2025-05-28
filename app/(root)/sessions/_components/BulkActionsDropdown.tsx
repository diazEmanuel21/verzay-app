'use client'

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

type BulkActionType = 'activate' | 'deactivate' | 'deleteAll' | 'clearHistory'
// type BulkActionType = 'activate' | 'deactivate' | 'deleteAll'

interface BulkActionsDropdownProps {
    userId: string
    onActivateAll: (userId: string) => Promise<any>
    onDeactivateAll: (userId: string) => Promise<any>
    onDeleteAll: (userId: string) => Promise<any>
    onClearHistory: (userId: string) => Promise<any>
    onSuccess?: () => void
}

export const BulkActionsDropdown: React.FC<BulkActionsDropdownProps> = ({
    userId,
    onActivateAll,
    onDeactivateAll,
    onDeleteAll,
    onClearHistory,
    onSuccess,
}) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<BulkActionType | null>(null)
    const [confirmationText, setConfirmationText] = useState('')

    const actionMap: Record<BulkActionType, {
        label: string
        confirmPhrase: string
        handler: (userId: string) => Promise<any>
        toastId: string
    }> = {
        activate: {
            label: 'Activar clientes',
            // confirmPhrase: 'Activar clientes',
            confirmPhrase: 'si',
            handler: onActivateAll,
            toastId: 'activate-all',
        },
        deactivate: {
            label: 'Desactivar clientes',
            // confirmPhrase: 'Desactivar clientes',
            confirmPhrase: 'si',
            handler: onDeactivateAll,
            toastId: 'deactivate-all',
        },
        deleteAll: {
            label: 'Eliminar clientes',
            // confirmPhrase: 'Eliminar clientes',
            confirmPhrase: 'si',
            handler: onDeleteAll,
            toastId: 'delete-all',
        },
        clearHistory: {
            label: 'Borrar historial de todos',
            // confirmPhrase: 'Borrar historial de todos',
            confirmPhrase: 'si',
            handler: onClearHistory,
            toastId: 'clear-history',
        },
    }

    const openDialog = (type: BulkActionType) => {
        setActionType(type)
        setConfirmationText('')
        setDialogOpen(true)
    }

    const confirmAction = async () => {
        if (!actionType) return

        const { handler, label, toastId, confirmPhrase } = actionMap[actionType]

        toast.loading(`${label}...`, { id: toastId })

        try {
            const result = await handler(userId)
            if (result.success) {
                toast.success(result.message || `${label} completado`, { id: toastId })
                onSuccess?.()
            } else {
                toast.error(result.message || `Error al ejecutar ${label}`, { id: toastId })
            }
        } catch (error) {
            console.error(`Error en ${label}:`, error)
            toast.error(`Error inesperado al ejecutar ${label}`, { id: toastId })
        } finally {
            setDialogOpen(false)
        }
    }

    const isConfirmValid = actionType
        ? confirmationText.trim() === actionMap[actionType].confirmPhrase
        : false

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones generales</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-blue-600"
                        onClick={() => openDialog('activate')}
                    >
                        Activar clientes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDialog('deactivate')}
                    >
                        Desactivar clientes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDialog('clearHistory')}
                    >
                        Borrar historial de todos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDialog('deleteAll')}
                    >
                        Eliminar clientes
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Estás seguro de que quieres ejecutar esta acción masiva?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            Esta acción <strong className="text-red-600">NO</strong> se puede deshacer.
                            Para confirmar, escribe exactamente:
                            <span className="block font-semibold text-foreground">
                                {actionType ? `"${actionMap[actionType].confirmPhrase}"` : ''}
                            </span>
                            <Input
                                placeholder="Escribe aquí..."
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAction}
                            disabled={!isConfirmValid}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
