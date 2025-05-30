'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import { ClientInterface } from '@/lib/types';
import {
    createUserWithPausar,
    deleteUser,
    updateAbrirPhrase,
    updateClientData
} from '@/actions/userClientDataActions';
import { CreateDialog, DeleteDialog, ToolsDialog, EditDialog } from './';
import { ApiKey } from '@prisma/client';

export type DialogType = 'editar' | 'tools' | 'delete'

interface Props {
    users: ClientInterface[],
    apikeys: ApiKey[],
    availableApikeys: ApiKey[],
    currentUserRol: string,
};

export const ClientsManager = ({ users, apikeys, availableApikeys, currentUserRol }: Props) => {
    const router = useRouter();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openToolsDialog, setOpenToolsDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [user, setCurrentUser] = useState<ClientInterface>();

    const handleCreate = async (formData: FormData) => {
        const toastId = 'create-client';
        toast.loading('Creando cliente...', { id: toastId });

        const result = await createUserWithPausar({
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            openingPhrase: 'Fue un gusto ayudarle.',
            role: 'user',
            plan: 'pymes',
            del_seguimiento: 'Estamos para servirle.',
            apiUrl: 'https://api.openAI.co',
            company: 'Nombre empresa',
            notificationNumber: '0000000000',
            apiKeyId: formData.get('apiKeyId') as string,
            lat: '0.0000',
            lng: '0.0000',
            mapsUrl: 'https://maps.google.com/?q=0,0',
            theme: 'Default',
            image: null,
            emailVerified: null,
            autoReactivate: '30',
            webhookUrl: 'https://n8npro.verzay.co/webhook',
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
        const toastId = 'edit-client';
        toast.loading('Actualizando...', { id: toastId });

        // === Validación y actualización de openMsg ===
        if (formData.has('openMsg')) {
            const currentValue = String(formData.get('openMsg') ?? '');

            const currentUser = users.find(user => user.id === userId);
            const savedMsg = currentUser?.pausar.find(p => p.tipo === 'abrir')?.mensaje ?? '';
            if (savedMsg !== currentValue) {
                const result = await updateAbrirPhrase(userId, currentValue);
                if (!result.success) {
                    toast.error(result.message || 'Error al actualizar abrirPhrase', { id: toastId });
                    return;
                }
            }
        }

        // === Eliminar campo derivado ===
        formData.delete('openMsg');

        // === Actualización del cliente ===
        const result = await updateClientData(userId, formData);

        if (result.success) {
            toast.success('Cliente actualizado', { id: toastId });
            router.refresh();
            setOpenEditDialog(false);
        } else {
            toast.error(result.message || 'Error al editar cliente', { id: toastId });
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

    const columns = getColumns(openDialogGetUserId, currentUserRol);

    return (
        <>
            {/* Gestión de clients */}
            <DataTable
                columns={columns}
                data={users}
                currentUserRol={currentUserRol}
                openCreateDialogUser={openCreateDialogUser}
            />

            {/* Dialog create */}
            {availableApikeys && (
                <CreateDialog
                    handleCreate={handleCreate}
                    setOpenCreateDialog={setOpenCreateDialog}
                    openCreateDialog={openCreateDialog}
                    apikeys={availableApikeys}
                />
            )}
            {/* Dialog delete */}
            {user && apikeys && (
                <EditDialog
                    openEditDialog={openEditDialog}
                    setOpenEditDialog={setOpenEditDialog}
                    handleEdit={handleEdit}
                    user={user}
                    apikeys={apikeys}
                    currentUserRol={currentUserRol}
                />
            )}
            {/* Dialog delete */}
            {user && (
                <DeleteDialog
                    handleDelete={handleDelete}
                    openDeleteDialog={openDeleteDialog}
                    setOpenDeleteDialog={setOpenDeleteDialog}
                    user={user}
                />
            )}
            {/* Tools */}
            {user && (
                <ToolsDialog
                    openToolsDialog={openToolsDialog}
                    setOpenToolsDialog={setOpenToolsDialog}
                    user={user}
                />
            )}
        </>
    );
};