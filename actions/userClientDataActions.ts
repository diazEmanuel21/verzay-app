'use server';

import { db } from '@/lib/db';
import { User, Pausar } from '@prisma/client';
import { revalidatePath } from 'next/cache';



interface ClientResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

type UserWithPausarMensaje = User & {
  pausarMensaje?: string;
};


// ==============================
// GET CLIENT DATA
// ==============================
export async function getAllUsers(): Promise<UserWithPausarMensaje[]> {
  const users = await db.user.findMany({
    include: { pausar: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => ({
    ...user,
    pausarMensaje: user.pausar.find((p) => p.tipo === 'abrir')?.mensaje || '',
  }));
}

// ==============================
// GET CLIENT DATA BY USER ID
// ==============================
export const getClientDataByUserId = async (userId: string): Promise<ClientResponse<User & { abrirPhrase?: string }>> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        pausar: true, // relación con tabla Pausar
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found.',
      };
    }

    const abrirPhrase = user.pausar.find(p => p.tipo === 'abrir')?.mensaje;

    return {
      success: true,
      message: 'User and Pausar data fetched successfully.',
      data: {
        ...user,
        abrirPhrase: abrirPhrase || '',
      },
    };
  } catch (error) {
    console.error('Error fetching client data:', error);
    return {
      success: false,
      message: 'Error fetching client data.',
    };
  }
};

// ==============================
// UPDATE CLIENT DATA
// ==============================
export const updateClientData = async (
  userId: string,
  updates: Partial<Record<string, string>>
): Promise<ClientResponse<{ updatedField: string; newValue: string }>> => {
  try {
    const field = Object.keys(updates)[0];
    console.log(`*******************field${JSON.stringify(field)}`);
    console.log(`*******************updates${JSON.stringify(updates)}`);
    const value = updates[field];
    console.log(`*******************value${value}`);

    if (!field || value === undefined) {
      return { success: false, message: 'Campo o valor inválido' };
    }

    if (field === 'abrirPhrase') {
      const existing = await db.pausar.findFirst({
        where: { userId, tipo: 'abrir' },
      });

      if (existing) {
        await db.pausar.update({
          where: { id: existing.id },
          data: { mensaje: value },
        });
      } else {
        await db.pausar.create({
          data: {
            userId,
            tipo: 'abrir',
            mensaje: value,
            baseurl: 'https://conexion.verzay.co',
            instanciaId: 'default-instancia-id',
            apikeyId: 'default-apikey-id',
          },
        });
      }

      return {
        success: true,
        message: 'Frase de apertura actualizada',
        data: { updatedField: field, newValue: value },
      };
    }

    // Cualquier otro campo de User
    await db.user.update({
      where: { id: userId },
      data: { [field]: value },
    });

    return {
      success: true,
      message: `Campo ${field} actualizado correctamente`,
      data: { updatedField: field, newValue: value },
    };
  } catch (error) {
    console.error('Error actualizando datos del cliente:', error);
    return { success: false, message: 'Error interno al guardar' };
  }
};


// ==============================
// CREATE USER + INSERT TO PAUSAR
// ==============================
export const createUserWithPausar = async (
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { openingPhrase?: string }
): Promise<ClientResponse<User>> => {
  try {
    const { openingPhrase, ...userFields } = userData;


    console.log(userData);
    const user = await db.user.create({
      data: {
        ...userFields,
      },
    });

    if (openingPhrase) {
      await db.pausar.create({
        data: {
          userId: user.id,
          instanciaId: 'default-instancia-id',
          apikeyId: 'default-apikey-id',
          tipo: 'abrir',
          mensaje: openingPhrase,
          baseurl: 'https://conexion.verzay.co',
        },
      });
    }

    return {
      success: true,
      message: 'User and Pausar data created successfully.',
      data: user,
    };
  } catch (error) {
    console.error('Error creating user and Pausar record:', error);
    return {
      success: false,
      message: 'Error creating user.',
    };
  }
};

// ==============================
// DELETE USER
// ==============================
export async function deleteUser(id: string): Promise<ClientResponse> {
  if (!id) {
    return {
      success: false,
      message: 'User ID is required.',
    };
  }

  try {
    await db.user.delete({
      where: { id },
    });

    revalidatePath("/admin/clientes");

    return {
      success: true,
      message: 'User deleted successfully.',
    };
  } catch (error) {
    console.error('Error deleting user:', error);

    return {
      success: false,
      message: 'Failed to delete user.',
    };
  }
}