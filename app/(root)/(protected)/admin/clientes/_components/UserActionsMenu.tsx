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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
    user: UserWithPausar
    onEdit: (userId: string, formData: FormData) => void
    onDelete: (userId: string) => void
    deletingUserId: string | null
}

export const UserActionsMenu = ({ user, onEdit, onDelete, deletingUserId }: Props) => {
    const [openDelete, setOpenDelete] = useState(false)
    const [openTools, setOpenTools] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)

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

                    <DropdownMenuItem onClick={() => setOpenEdit(true)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenTools(true)}>Herramientas</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-red-600">
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Editar Modal */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            onEdit(user.id, formData)
                            setOpenEdit(false)
                        }}
                    >
                        <div>
                            <Label>Nombre</Label>
                            <Input name="name" defaultValue={user.name || ''} />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input name="email" defaultValue={user.email} />
                        </div>
                        <div>
                            <Label>Contraseña</Label>
                            <Input name="password" placeholder="•••••••" />
                        </div>
                        <Button type="submit">Guardar</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Herramientas Modal */}
            <Dialog open={openTools} onOpenChange={setOpenTools}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Herramientas</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input placeholder="Ej: Herramienta X" />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Input placeholder="Descripción de la herramienta" />
                        </div>
                        <Button type="submit">Guardar Herramienta</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmación de Eliminación */}
            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar cliente?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>¿Estás seguro de eliminar a <strong>{user.name}</strong>?</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenDelete(false)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onDelete(user.id)
                                    setOpenDelete(false)
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