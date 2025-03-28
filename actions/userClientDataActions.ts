'use server';

import { db } from '@/lib/db';
import { UserWithPausar } from '@/lib/types';
import { Pausar } from '@prisma/client';
import { revalidatePath } from 'next/cache';



interface ClientResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}


// ==============================
// GET CLIENT DATA
// ==============================
export async function getAllUsers(): Promise<ClientResponse<UserWithPausar[]>> {  // <-- Nota el array []
  try {
    const users = await db.user.findMany({
      include: {
        pausar: true
        //{ where: { tipo: 'abrir' },  // Filtro opcional directamente en la query
        //orderBy: { createdAt: 'desc' }  // Ordenar pausas si es necesario }
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!users) {
      return {
        success: false,
        message: 'No se encontraron registros.',
      };
    }

    return {
      success: true,
      message: 'User and Pausar data fetched successfully.',
      data: users
    };

  } catch (error) {
    console.error('Error fetching client data:', error);
    return {
      success: false,
      message: 'Error fetching client data.',
    };
  }
}

// ==============================
// GET CLIENT DATA BY USER ID
// ==============================
export const getClientDataByUserId = async (userId: string): Promise<ClientResponse<UserWithPausar>> => {
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

    return {
      success: true,
      message: 'User and Pausar data fetched successfully.',
      data: {
        ...user
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
// UPDATE CLIENT DATA BY FIELD
// ==============================
export const updateClientDataByField = async (
  userId: string,
  field: string,
  value: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (field === 'openMsg') {
      return {
        success: false,
        message: 'El campo openMsg está restringido y no puede ser actualizado aquí.',
      };
    }
    if (field === '') {
      return {
        success: false,
        message: 'El campo no existe en este formulario.',
      };
    }

    await db.user.update({
      where: { id: userId },
      data: { [field]: value },
    });

    return {
      success: true,
      message: `Campo "${field}" actualizado correctamente.`,
    };
  } catch (error) {
    console.error('Error actualizando datos del cliente:', error);
    return {
      success: false,
      message: 'Error interno al actualizar los datos.',
    };
  }
};
// ==============================
// UPDATE CLIENT DATA
// ==============================
export const updateClientData = async (
  userId: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> => {
  try {
    const restrictedFields = ['openMsg']

    const dataToUpdate: Record<string, any> = {}

    formData.forEach((value, key) => {
      if (restrictedFields.includes(key)) return

      dataToUpdate[key] = value
    })

    if (Object.keys(dataToUpdate).length === 0) {
      return {
        success: false,
        message: 'No se encontraron campos válidos para actualizar.',
      }
    }

    await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
    })

    return {
      success: true,
      message: 'Datos del cliente actualizados correctamente.',
    }
  } catch (error) {
    console.error('Error actualizando datos del cliente desde formData:', error)
    return {
      success: false,
      message: 'Error interno al actualizar los datos.',
    }
  }
}
// ==============================
// UPDATE PAUSA DATA
// ==============================
export const updateAbrirPhrase = async (userId: string, mensaje: string) => {
  try {
    const userWithPausar = await db.user.findUnique({
      where: { id: userId },
      include: {
        pausar: true, // o filtra con where si solo te interesa tipo = 'abrir'
      },
    });

    if (!userWithPausar) return { success: false, message: 'No se encontró el usuario.' };

    const pausa = userWithPausar?.pausar.find(p => p.tipo === 'abrir');
    const pausarId = pausa?.id;

    if (!pausa) return { success: false, message: 'Debe existir una frase creada por defecto.' };

    await db.pausar.update({
      where: { id: pausarId },
      data: { mensaje },
    });

    return { success: true, message: 'Frase actualizada correctamente' };
  } catch (error) {
    console.error('Error actualizando openMsg:', error);
    return { success: false, message: 'Error actualizando la frase' };
  }
};


// ==============================
// CREATE USER + INSERT TO PAUSAR
// ==============================
export const createUserWithPausar = async (
  userData: Omit<UserWithPausar, 'id' | 'createdAt' | 'updatedAt' | 'pausar'> & {
    openingPhrase?: string;
  }
): Promise<ClientResponse<UserWithPausar>> => {
  try {
    const { openingPhrase, ...userFields } = userData;

    // 1. Crear el usuario
    const user = await db.user.create({
      data: userFields,
    });

    let pausarRecord: Pausar | null = null;

    // 2. Crear registro Pausar si existe openingPhrase
    if (openingPhrase) {
      pausarRecord = await db.pausar.create({
        data: {
          userId: user.id,
          instanciaId: 'default-instancia-id', // Considera hacer estos parámetros opcionales
          apikeyId: 'default-apikey-id',
          tipo: 'abrir',
          mensaje: openingPhrase,
          baseurl: 'https://conexion.verzay.co',
        },
      });
    }

    // 3. Obtener el usuario con sus relaciones para devolverlo completo
    const createdUser = await db.user.findUnique({
      where: { id: user.id },
      include: { pausar: true },
    });

    if (!createdUser) {
      throw new Error('User creation failed');
    }

    return {
      success: true,
      message: 'User and Pausar data created successfully',
      data: createdUser as UserWithPausar,
    };
  } catch (error) {
    console.error('Error creating user and Pausar record:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating user',
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