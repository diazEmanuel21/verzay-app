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

/* ------------------------------- Helpers ------------------------------- */

/** Campos que no deben actualizarse desde formularios genéricos */
const RESTRICTED_FIELDS = new Set<string>(['openMsg']);

/** Campos booleanos que pueden venir como hidden+checkbox (varios valores) */
const BOOLEAN_FIELDS = ['muteAgentResponses', 'onFacebook', 'onInstagran'] as const;
type BooleanField = typeof BOOLEAN_FIELDS[number];

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

/* --------------------------- Listado enriquecido --------------------------- */

export async function getEnrichedClients(
  filter?: FilterOptions
): Promise<ClientResponse<ClientInterface[]>> {
  try {
    let userIds: string[] | undefined;

    if (filter?.resellerId) {
      const assignments = await db.reseller.findMany({
        where: { resellerid: filter.resellerId },
        select: { userId: true },
      });
      userIds = assignments.map(a => a.userId).filter(Boolean) as string[];

      if (!userIds.length) {
        return { success: true, message: "No hay usuarios asignados.", data: [] };
      }
    }

    const users = await db.user.findMany({
      where: userIds ? { id: { in: userIds } } : undefined,
      include: { pausar: true },
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
              const responseInstanceStatus = await fetch(
                `https://${resDataApi.url}/webhook/find/${resDataApi.instanceName}`,
                { method: "GET", headers: { apikey: resDataApi.key } }
              );

              const result = await responseInstanceStatus.json();
              isEvoEnabled = result?.enabled ?? false;

              // Si no está habilitado, pedimos QR para saber si debe reconectarse
              if (!isEvoEnabled) {
                const responseQrStatus = await generateQRCode({
                  instanceName: resDataApi?.instanceName,
                  userId: user.id,
                });
                qrStatus = !!responseQrStatus.qr;
              }
            }
          } catch (error) {
            console.warn(`No se pudo obtener isEvoEnabled para el usuario ${user.id}`, error);
          }
        }

        // Buscar reseller asociado
        const assigned = await db.reseller.findFirst({ where: { userId: user.id } });
        if (assigned?.resellerid) {
          reseller = await db.user.findFirst({ where: { id: assigned.resellerid } });
        }

        // Créditos IA
        const resCredits = await getIaCreditByUser(user.id);
        if (resCredits.success && resCredits.data && resCredits.data.length > 0) {
          credits = resCredits.data[0];
        }

        return {
          ...user,
          pausar: user.pausar as Pausar[],
          isEvoEnabled,
          qrStatus,
          reseller,
          credits,
        };
      })
    );

    return { success: true, message: "Datos de usuarios cargados correctamente.", data: enrichedUsers };
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return { success: false, message: "Error al obtener clientes." };
  }
}

/* ------------------------ Obtener cliente por ID ------------------------ */

export const getClientDataByUserId = async (
  userId: string
): Promise<ClientResponse<UserWithPausar>> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { pausar: true },
    });

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    return { success: true, message: 'User and Pausar data fetched successfully.', data: { ...user } };
  } catch (error) {
    console.error('Error fetching client data:', error);
    return { success: false, message: 'Error fetching client data.' };
  }
};

/* ----------------- Actualización de un campo por nombre ----------------- */

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

/* --------------------- Actualización desde FormData --------------------- */

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

/* -------------------------- Actualizar frase abrir -------------------------- */

export const updateAbrirPhrase = async (userId: string, mensaje: string) => {
  try {
    const userWithPausar = await db.user.findUnique({
      where: { id: userId },
      include: { pausar: true },
    });

    if (!userWithPausar) return { success: false, message: 'No se encontró el usuario.' };

    const pausa = userWithPausar.pausar.find(p => p.tipo === 'abrir');
    if (!pausa?.id) return { success: false, message: 'Debe existir una frase creada por defecto.' };

    await db.pausar.update({ where: { id: pausa.id }, data: { mensaje } });

    return { success: true, message: 'Frase actualizada correctamente' };
  } catch (error) {
    console.error('Error actualizando openMsg:', error);
    return { success: false, message: 'Error actualizando la frase' };
  }
};

/* -------------------- Crear usuario + registro en Pausar -------------------- */

export const createUserWithPausar = async (
  userData: Omit<UserWithPausar, 'id' | 'createdAt' | 'updatedAt' | 'pausar'> & {
    openingPhrase?: string;
  }
): Promise<ClientResponse<UserWithPausar>> => {
  try {
    const { openingPhrase, ...userFields } = userData;

    // Asegurar defaults razonables en booleanos
    const safeUserFields = {
      onFacebook: false,
      onInstagran: false,
      muteAgentResponses: false,
      ...userFields,
    };

    const user = await db.user.create({ data: safeUserFields });

    if (openingPhrase) {
      await db.pausar.create({
        data: {
          userId: user.id,
          instanciaId: 'default-instancia-id', // TODO: parametrizar
          apikeyId: 'default-apikey-id',       // TODO: parametrizar
          tipo: 'abrir',
          mensaje: openingPhrase,
          baseurl: 'https://conexion.verzay.co',
        },
      });
    }

    const createdUser = await db.user.findUnique({
      where: { id: user.id },
      include: { pausar: true },
    });

    if (!createdUser) throw new Error('User creation failed');

    return { success: true, message: 'User and Pausar data created successfully', data: createdUser as UserWithPausar };
  } catch (error) {
    console.error('Error creating user and Pausar record:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Error creating user' };
  }
};

/* ---------------------------- Borrado (simple) ---------------------------- */

export async function deleteUserOld(id: string): Promise<ClientResponse> {
  if (!id) return { success: false, message: 'User ID is required.' };

  try {
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/clientes");
    return { success: true, message: 'User deleted successfully.' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user.' };
  }
}

/* ------------------------ Borrado con dependencias ------------------------ */

export async function deleteUser(id: string) {
  if (!id) return { success: false, message: 'User ID is required.' };

  try {
    await db.$transaction(async (tx) => {
      // 1. Relaciones explícitas no cubiertas por onDelete: Cascade
      await tx.reseller.deleteMany({ where: { userId: id } });       // como cliente
      await tx.reseller.deleteMany({ where: { resellerid: id } });   // como revendedor

      // 2. Workflows y dependencias
      const workflows = await tx.workflow.findMany({ where: { userId: id } });
      const workflowIds = workflows.map(w => w.id);

      if (workflowIds.length > 0) {
        await tx.workflowNode.deleteMany({ where: { workflowId: { in: workflowIds } } });
        await tx.rr.deleteMany({ where: { workflowId: { in: workflowIds } } });
      }
      await tx.workflow.deleteMany({ where: { userId: id } });

      // 3. Otras tablas relacionadas
      await tx.reminders.deleteMany({ where: { userId: id } });

      const sessionInstanceIds = (await tx.session.findMany({
        where: { userId: id },
        select: { instanceId: true },
      })).map(s => s.instanceId);

      if (sessionInstanceIds.length > 0) {
        await tx.sessionTrigger.deleteMany({ where: { sessionId: { in: sessionInstanceIds } } });
        await tx.n8n_chat_histories.deleteMany({ where: { session_id: { in: sessionInstanceIds } } });
      }

      await tx.seguimientos.deleteMany({ where: { apikey: id } }); // ajustar a tu modelo real

      // 4. Finalmente, el usuario
      await tx.user.delete({ where: { id } });
    });

    revalidatePath("/admin/clientes");
    return { success: true, message: 'User and all related data deleted successfully.' };
  } catch (error) {
    console.error('❌ Error deleting user and related data:', error);
    return { success: false, message: 'Failed to delete user and related data.' };
  }
}
