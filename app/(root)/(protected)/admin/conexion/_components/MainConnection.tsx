'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agregarApi, eliminarApiKey } from "@/actions/api-action";
import ApiKeysTable from "@/components/shared/apikeystable";
import { DialogApiKeyType } from "../connection-types";
import { ApiKey, User } from "@prisma/client";
import { getColumns, DataGrid, CreateDialog, EditDialog, DeleteDialog } from "./";
import { Button } from "@/components/ui/button";

import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
    searchParams: { [key: string]: string | undefined },
    user: User
    apiKeys: ApiKey[]
};

export const MainConnection = ({ searchParams, user, apiKeys }: Props) => {
    const router = useRouter();
    const [apiKeyId, setApiKeyId] = useState<string>();
    /* Dialog actions */
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const currentApiKey = apiKeys.filter(ak => ak.id === apiKeyId)[0];

    const handleEdit = async (id: string, formData: FormData) => {
        // const response = await editarApiKey(id, formData);
    };

    const handleCreate = async (formData: FormData) => {
        const toastId = 'create-client';
        toast.loading('Creando cliente...', { id: toastId });

        const result = await agregarApi(formData);

        // if (result.success) {
        //     toast.success('Cliente creado', { id: toastId });
        //     router.refresh();
        // } else {
        //     toast.error(result.message || 'Error al crear cliente', { id: toastId });
        // }

        setOpenCreateDialog(false);
    };


    const handleDelete = async (id: string) => {
        const response = await eliminarApiKey(id);
    };

    const handleDialogAction = (apiKeyId: string, dialogType: DialogApiKeyType) => {
        setApiKeyId(apiKeyId);

        if (dialogType === 'create') return setOpenCreateDialog(true);
        if (dialogType === 'edit') return setOpenEditDialog(true);
        if (dialogType === 'delete') return setOpenDeleteDialog(true);
    };

    const columns = getColumns(handleDialogAction);

    return (
        <>
            {/* button-create-client */}
            <div className='absolute top-3 right-2'>
                <Button
                    onClick={() => handleDialogAction('null', 'create')}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                    Crear
                    <PlusCircle />
                </Button>
            </div>
            <DataGrid<ApiKey, unknown> columns={columns} data={apiKeys} />


            {/* Dialog create */}
            <CreateDialog
                handleCreate={handleCreate}
                setOpenCreateDialog={setOpenCreateDialog}
                openCreateDialog={openCreateDialog}
            />
            {/* Dialog delete */}
            {currentApiKey && (
                <EditDialog
                    handleEdit={handleEdit}
                    setOpenEditDialog={setOpenEditDialog}
                    openEditDialog={openEditDialog}
                    apikey={currentApiKey}
                />
            )}
            {/* Dialog delete */}
            {currentApiKey && (
                <DeleteDialog
                    handleDelete={handleDelete}
                    setOpenDeleteDialog={setOpenDeleteDialog}
                    openDeleteDialog={openDeleteDialog}
                    apikey={currentApiKey}
                />
            )}

            {/* 
            <div className="container">
                <form action={agregarApi} className="flex flex-col gap-y-4">
                    <div className="mb-4">
                        <input
                            type="text"
                            name="url"
                            placeholder="Ingresa la url de Evolution"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            name="key"
                            placeholder="Ingresa la Apikey"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <input
                        type="hidden"
                        name="userId"
                        value={user.id}
                    />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        AGREGAR
                    </button>
                </form>
            </div>

            <ApiKeysTable /> */}
        </>
    )
};
