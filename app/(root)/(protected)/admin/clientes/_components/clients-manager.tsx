'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import {
    createUserWithPausar,
    deleteUser,
    updateClientData
} from '@/actions/userClientDataActions';
import { Button } from '@/components/ui/button';
import { User } from '@prisma/client';
import { PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CreateDialog, DeleteDialog, ToolsDialog, EditDialog } from './';

type UserWithPausar = User & { pausarMensaje?: string };
export type DialogType = 'editar' | 'tools' | 'delete'

export const ClientsManager = ({ users }: { users: UserWithPausar[] }) => {
    const router = useRouter();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openToolsDialog, setOpenToolsDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [user, setCurrentUser] = useState<UserWithPausar>();

    const handleCreate = async (formData: FormData) => {
        const toastId = 'create-client';
        toast.loading('Creando cliente...', { id: toastId });

        const result = await createUserWithPausar({
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            openingPhrase: 'Fue un gusto ayudarte.',
            role: 'user',
            apiUrl: 'https://api.openAI.co',
            company: 'Nombre empresa',
            notificationNumber: '0000000000',
            lat: '0.0000',
            lng: '0.0000',
            mapsUrl: 'https://maps.google.com/?q=0,0',
            image: null,
            emailVerified: null,
        });

        if (result.success) {
            toast.success('Cliente creado', { id: toastId });
            router.refresh();
        } else {
            toast.error(result.message || 'Error al crear cliente', { id: toastId });
        }

        setOpenCreateDialog(false);
    };

    const handleEdit = async (userId: string, formData: FormData) => {
        const result = await updateClientData(userId, formData);
        if (result.success) {
            toast.success('Cliente actualizado');
            router.refresh();
        } else {
            toast.error(result.message || 'Error al editar cliente');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!userId || userId === '' || !openDeleteDialog) return toast.error('Faltan parametros para completar la ejecución.');;

        const toastId = 'delete-client';
        toast.loading('Eliminando cliente...', { id: toastId });
        const result = await deleteUser(userId);

        if (result.success) {
            toast.success('Cliente eliminado', { id: toastId });
            router.refresh();
        } else {
            toast.error('Error al eliminar cliente', { id: toastId });
        }
    };

    const openDialogGetUserId = (userId: string, dialog: DialogType, state: boolean) => {
        const currentUser = users.filter(user => user.id === userId)[0];
        setCurrentUser(currentUser);

        if (dialog === 'tools') return setOpenToolsDialog(state);
        if (dialog === 'delete') return setOpenDeleteDialog(state);
        if (dialog === 'editar') return setOpenEditDialog(state);
    };

    const openCreateDialogUser = () => {
        setOpenCreateDialog(true);
    };

    const columns = getColumns(openDialogGetUserId);

    return (
        <Card className='p-6'>
            {/* button-create-client */}
            <div className='absolute top-3 right-2'>
                <Button
                    onClick={openCreateDialogUser}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                    Create
                    <PlusCircle />
                </Button>
            </div>

            {/* Tabla de datos */}
            <DataTable columns={columns} data={users} />

            {/* Dialog create */}
            <CreateDialog
                handleCreate={handleCreate}
                setOpenCreateDialog={setOpenCreateDialog}
                openCreateDialog={openCreateDialog}
            />
            {/* Dialog delete */}
            {user && (
                <DeleteDialog
                    handleDelete={handleDelete}
                    openDeleteDialog={openDeleteDialog}
                    setOpenDeleteDialog={setOpenDeleteDialog}
                    user={user}
                />
            )}
            {user && (
                <ToolsDialog
                    openToolsDialog={openToolsDialog}
                    setOpenToolsDialog={setOpenToolsDialog}
                    user={user}
                />
            )}
        </Card>
    );
};