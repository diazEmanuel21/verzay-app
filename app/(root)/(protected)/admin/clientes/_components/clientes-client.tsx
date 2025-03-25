'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import {
  createUserWithPausar,
  updateClientData,
  deleteUser
} from '@/actions/userClientDataActions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from '@prisma/client';

type UserWithPausar = User & { pausarMensaje?: string };

export const ClientesPageClient = ({ users }: { users: UserWithPausar[] }) => {
  const router = useRouter();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleEdit = async (userId: string, formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const result = await updateClientData(userId, data);
    if (result.success) {
      toast.success('Cliente actualizado');
      router.refresh();
    } else {
      toast.error(result.message || 'Error al editar cliente');
    }
  };

  const handleDelete = async (userId: string) => {
    setDeletingUserId(userId);
    const result = await deleteUser(userId);
    setDeletingUserId(null);

    if (result.success) {
      toast.success('Cliente eliminado');
      router.refresh();
    } else {
      toast.error('Error al eliminar cliente');
    }
  };

  const columns = getColumns(handleEdit, handleDelete, deletingUserId);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Gestión de Clientes</h1>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <span className="text-lg font-semibold">Agregar Cliente</span>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              const toastId = 'create-client';
              toast.loading('Creando cliente...', { id: toastId });

              const result = await createUserWithPausar({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                openingPhrase: 'Fue un gusto ayudarte.',
                role: 'user',
                apiUrl: 'https://api.openAI.co',
                company: 'Empresa Demo',
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
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <Label>Nombre</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input name="password" required />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                Crear Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de datos */}
      <DataTable columns={columns} data={users} />
    </div>
  );
};
