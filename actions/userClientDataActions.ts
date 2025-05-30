'use server';

import { db } from '@/lib/db';
import { UserWithPausar } from '@/lib/types';
import { IaCredit, Pausar, User } from '@prisma/client';
import { getDataApi } from "@/actions/api-action";
import { ClientInterface } from "@/lib/types";
import { revalidatePath } from 'next/cache';
import { getIaCreditByUser } from './actions-ia-credits';

interface ClientResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}
type FilterOptions = {
  resellerId?: string;
};

export async function getEnrichedClients(filter?: FilterOptions): Promise<ClientResponse<ClientInterface[]>> {
  try {
    let userIds: string[] | undefined;

    if (filter?.resellerId) {
      const assignments = await db.reseller.findMany({
        where: { resellerid: filter.resellerId },
        select: { userId: true },
      });
      userIds = assignments.map(a => a.userId).filter(Boolean) as string[];

      if (!userIds.length) {
        return {
          success: true,
          message: "No hay usuarios asignados.",
          data: [],
        };
      }
    }

    const users = await db.user.findMany({
      where: userIds ? { id: { in: userIds } } : undefined,
      include: {
        pausar: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedUsers: ClientInterface[] = await Promise.all(
      users.map(async (user): Promise<ClientInterface> => {
        let isEvoEnabled = false;
        let reseller: User | null = null;
        let credits: IaCredit | null = null;

        if (user.apiKeyId) {
          try {
            const dataApi = await getDataApi(user.id, user.apiKeyId);
            const resDataApi = dataApi?.data;

            if (resDataApi?.url && resDataApi?.instanceName && resDataApi?.key) {
              const response = await fetch(`https://${resDataApi.url}/webhook/find/${resDataApi.instanceName}`, {
                method: "GET",
                headers: {
                  apikey: resDataApi.key,
                },
              });

              const result = await response.json();
              isEvoEnabled = result?.enabled ?? false;
            }
          } catch (error) {
            console.warn(`No se pudo obtener isEvoEnabled para el usuario ${user.id}`, error);
          }
        }

        // Buscar reseller asociado
        const assigned = await db.reseller.findFirst({
          where: { userId: user.id },
        });

        if (assigned?.resellerid !== null && assigned?.resellerid !== undefined) {
          const resellerAsUser = await db.user.findFirst({
            where: { id: assigned.resellerid },
          });

          reseller = resellerAsUser;
        }

        // Buscar créditos por usuario
        const resCredits = await getIaCreditByUser(user.id);
        if (resCredits.success && resCredits.data && resCredits.data.length > 0) {
          credits = resCredits.data[0]
        }

        return {
          ...user,
          pausar: user.pausar as Pausar[],
          isEvoEnabled,
          reseller,
          credits
        };
      })
    );

    return {
      success: true,
      message: "Datos de usuarios cargados correctamente.",
      data: enrichedUsers,
    };
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return {
      success: false,
      message: "Error al obtener clientes.",
    };
  }
}

// ==============================
// GET CLIENT DATA
// ==============================
// export async function getAllClients(): Promise<ClientResponse<ClientInterface[]>> {
//   try {
//     const users = await db.user.findMany({
//       include: {
//         pausar: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     if (!users || users.length === 0) {
//       return {
//         success: false,
//         message: 'No se encontraron registros.',
//       };
//     }

//     const clientData: ClientInterface[] = await Promise.all(
//       users.map(async (user): Promise<ClientInterface> => {
//         let isEvoEnabled = false;

//         if (user.apiKeyId) {
//           try {
//             const dataApi = await getDataApi(user.id, user.apiKeyId);
//             const resDataApi = dataApi?.data;

//             if (resDataApi?.url && resDataApi?.instanceName && resDataApi?.key) {
//               const response = await fetch(`https://${resDataApi.url}/webhook/find/${resDataApi.instanceName}`, {
//                 method: "GET",
//                 headers: {
//                   apikey: resDataApi.key,
//                 },
//               });

//               const result = await response.json();
//               isEvoEnabled = result?.enabled ?? false;
//             }
//           } catch (error) {
//             console.warn(`No se pudo obtener isEvoEnabled para el usuario ${user.id}`, error);
//           }
//         }

//         return {
//           ...user,
//           pausar: user.pausar as Pausar[],
//           isEvoEnabled,
//         };
//       })
//     );

//     return {
//       success: true,
//       message: 'User and Pausar data fetched successfully.',
//       data: clientData,
//     };

//   } catch (error) {
//     console.error('Error fetching client data:', error);
//     return {
//       success: false,
//       message: 'Error fetching client data.',
//     };
//   }
// }
// ==============================
// GET CLIENT DATA BY ROL
// ==============================
// export async function getClientsByResellerId(resellerId: string): Promise<ClientResponse<ClientInterface[]>> {
//   try {
//     // Buscar usuarios asignados al reseller
//     const assignments = await db.reseller.findMany({
//       where: { resellerid: resellerId },
//       select: { userId: true },
//     });

//     const userIds = assignments.map(a => a.userId).filter(Boolean) as string[];

//     if (!userIds.length) {
//       return {
//         success: true,
//         message: "No hay usuarios asignados.",
//         data: [],
//       };
//     }

//     // Buscar usuarios con relación a Pausar
//     const users = await db.user.findMany({
//       where: { id: { in: userIds } },
//       include: {
//         pausar: true,
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const enrichedUsers: ClientInterface[] = await Promise.all(
//       users.map(async (user): Promise<ClientInterface> => {
//         let isEvoEnabled = false;

//         if (user.apiKeyId) {
//           try {
//             const dataApi = await getDataApi(user.id, user.apiKeyId);
//             const resDataApi = dataApi?.data;

//             if (resDataApi?.url && resDataApi?.instanceName && resDataApi?.key) {
//               const response = await fetch(`https://${resDataApi.url}/webhook/find/${resDataApi.instanceName}`, {
//                 method: "GET",
//                 headers: {
//                   apikey: resDataApi.key,
//                 },
//               });

//               const result = await response.json();
//               isEvoEnabled = result?.enabled ?? false;
//             }
//           } catch (error) {
//             console.warn(`No se pudo obtener isEvoEnabled para el usuario ${user.id}`, error);
//           }
//         }

//         return {
//           ...user,
//           pausar: user.pausar as Pausar[],
//           isEvoEnabled,
//         };
//       })
//     );

//     return {
//       success: true,
//       message: "Usuarios del reseller cargados correctamente.",
//       data: enrichedUsers,
//     };
//   } catch (error) {
//     console.error("Error al obtener usuarios del reseller:", error);
//     return {
//       success: false,
//       message: "Error al obtener usuarios del reseller.",
//     };
//   }
// }
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