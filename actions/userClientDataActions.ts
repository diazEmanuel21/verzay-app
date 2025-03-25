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
export const getClientData = async (userId: string): Promise<ClientResponse<User & { abrirPhrase?: string }>> => {
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

    const mensaje = user.pausar[0]?.mensaje;
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
  updatedFields: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<ClientResponse<User>> => {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: updatedFields,
    });

    return {
      success: true,
      message: 'Client data updated successfully.',
      data: user,
    };
  } catch (error) {
    console.error('Error updating client data:', error);
    return {
      success: false,
      message: 'Error updating client data.',
    };
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