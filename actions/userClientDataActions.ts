'use server';

import { db } from '@/lib/db';
import { UserWithPausar } from '@/lib/types';
import { IaCredit, Pausar, User } from '@prisma/client';
import { generateQRCode, getDataApi } from "@/actions/api-action";
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
const RESTRICTED_FIELDS = new Set<string>(['openMsg']);
const BOOLEAN_FIELDS = ['muteAgentResponses', 'onFacebook', 'onInstagram'] as const;

/** Normaliza un booleano desde FormData (soporta hidden+checkbox, "true"/"on") */
const normalizeBoolean = (fd: FormData, key: string): boolean | undefined => {
  if (!fd.has(key)) return undefined; // si no vino, no actualizar
  // getAll para considerar hidden + checkbox
  const values = fd.getAll(key).map(v => String(v).toLowerCase());
  return values.includes('true') || values.includes('on');
};

/** Copia valores no booleanos de FormData respetando campos restringidos */
const assignNonBooleanFields = (fd: FormData, target: Record<string, any>) => {
  fd.forEach((value, key) => {
    if (RESTRICTED_FIELDS.has(key)) return;
    if ((BOOLEAN_FIELDS as readonly string[]).includes(key)) return; // ya procesados
    target[key] = value;
  });
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
      orderBy: { name: "asc" },
    });

    const enrichedUsers: ClientInterface[] = await Promise.all(
      users.map(async (user): Promise<ClientInterface> => {
        let qrStatus = false;
        let isEvoEnabled = false;
        let reseller: User | null = null;
        let credits: IaCredit | null = null;

        if (user.apiKeyId) {
          try {
            const dataApi = await getDataApi(user.id, user.apiKeyId);
            const resDataApi = dataApi?.data;

            if (resDataApi?.url && resDataApi?.instanceName && resDataApi?.key) {
              const responseInstanceStatus = await fetch(`https://${resDataApi.url}/webhook/find/${resDataApi.instanceName}`, {
                method: "GET",
                headers: {
                  apikey: resDataApi.key,
                },
              });


              /* instance status */
              const result = await responseInstanceStatus.json();
              isEvoEnabled = result?.enabled ?? false;

              if (!isEvoEnabled) {
                const responseQrStatus = await generateQRCode({ instanceName: resDataApi?.instanceName, userId: user.id });

                /* qr status */
                const resQrStatus = !!responseQrStatus.qr; //si genera QR significa que el usuario se desconectó de whatsapp
                qrStatus = resQrStatus;
              }
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
          qrStatus,
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
      return { success: false, message: 'El campo openMsg está restringido y no puede ser actualizado aquí.' };
    }
    if (!field) {
      return { success: false, message: 'El campo no existe en este formulario.' };
    }

    const isBooleanField = (BOOLEAN_FIELDS as readonly string[]).includes(field);
    const parsedValue = isBooleanField ? (value === 'true' || value === 'on') : value;

    await db.user.update({
      where: { id: userId },
      data: { [field]: parsedValue },
    });

    return { success: true, message: `Campo "${field}" actualizado correctamente.` };
  } catch (error) {
    console.error('Error actualizando datos del cliente:', error);
    return { success: false, message: 'Error interno al actualizar los datos.' };
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
    const dataToUpdate: Record<string, any> = {};

    // 1) Procesa primero los booleanos con getAll (evita conflictos hidden+checkbox)
    (BOOLEAN_FIELDS as readonly string[]).forEach((key) => {
      const b = normalizeBoolean(formData, key);
      if (b !== undefined) dataToUpdate[key] = b;
    });

    // 2) Copia el resto de campos no booleanos
    assignNonBooleanFields(formData, dataToUpdate);

    // 3) Validación mínima
    if (Object.keys(dataToUpdate).length === 0) {
      return { success: false, message: 'No se encontraron campos válidos para actualizar.' };
    }

    await db.user.update({ where: { id: userId }, data: dataToUpdate });

    return { success: true, message: 'Datos del cliente actualizados correctamente.' };
  } catch (error) {
    console.error('Error actualizando datos del cliente desde formData:', error);
    return { success: false, message: 'Error interno al actualizar los datos.' };
  }
};

// ==============================
// Función para actualizar la duración de la reunión de un usuario
// ==============================
// Función para actualizar la duración de la reunión de un usuario
export async function updateUserMeetingDuration(userId: string, meetingDuration: number): Promise<ClientResponse> {
  try {
    // Validación para asegurarse de que la duración esté dentro del rango válido
    if (meetingDuration < 1 || meetingDuration > 480) {
      return {
        success: false,
        message: "La duración debe estar entre 1 y 480 minutos.",
      };
    }

    // Actualiza la duración de la reunión del usuario en la base de datos
    await db.user.update({
      where: { id: userId }, // Busca al usuario por su ID
      data: { meetingDuration }, // Actualiza el campo 'defaultMeetingDuration'
    });

    return {
      success: true,
      message: "Duración de reunión actualizada correctamente.",
    };
  } catch (error) {
    console.error("Error al actualizar la duración de la reunión:", error);
    return {
      success: false,
      message: "No se pudo actualizar la duración de la reunión.",
    };
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
export async function deleteUserOld(id: string): Promise<ClientResponse> {
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

export async function deleteUser(id: string) {
  if (!id) {
    return {
      success: false,
      message: 'User ID is required.',
    };
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Borrar relaciones explícitas no cubiertas por onDelete: Cascade

      await tx.reseller.deleteMany({ where: { userId: id } });       // cliente
      await tx.reseller.deleteMany({ where: { resellerid: id } });   // revendedor

      // 2. Desvincular al usuario de los módulos (UserModules es una relación N:N)
      // await tx.module.updateMany({
      //   where: {
      //     users: {
      //       some: { id },
      //     },
      //   },
      //   data: {
      //     users: {
      //       disconnect: { id },
      //     },
      //   },
      // });

      // 3. Borrar workflows y nodos relacionados (por userId)
      const workflows = await tx.workflow.findMany({ where: { userId: id } });
      const workflowIds = workflows.map(w => w.id);

      if (workflowIds.length > 0) {
        await tx.workflowNode.deleteMany({
          where: {
            workflowId: { in: workflowIds }
          }
        });
        await tx.rr.deleteMany({ where: { workflowId: { in: workflowIds } } });
      }

      await tx.workflow.deleteMany({ where: { userId: id } });

      // 4. Eliminar Reminders, SessionTrigger, n8n_chat_histories, seguimientos
      await tx.reminders.deleteMany({ where: { userId: id } });
      await tx.sessionTrigger.deleteMany({
        where: {
          sessionId: {
            in: (await tx.session.findMany({ where: { userId: id }, select: { instanceId: true } }))
              .map(s => s.instanceId)
          }
        }
      });
      await tx.n8n_chat_histories.deleteMany({
        where: {
          session_id: {
            in: (await tx.session.findMany({ where: { userId: id }, select: { instanceId: true } }))
              .map(s => s.instanceId)
          }
        }
      });
      await tx.seguimientos.deleteMany({
        where: {
          apikey: id // o usar campo relacionado, según tu implementación real
        }
      });

      // 5. Finalmente, eliminar al usuario (esto también borra onDelete: Cascade)
      await tx.user.delete({ where: { id } });
    });

    revalidatePath("/admin/clientes");

    return {
      success: true,
      message: 'User and all related data deleted successfully.',
    };
  } catch (error) {
    console.error('❌ Error deleting user and related data:', error);
    return {
      success: false,
      message: 'Failed to delete user and related data.',
    };
  }
}
