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
    return { success: false, message: 'User ID is required.' };
  }

  const t0 = Date.now();
  const elapsed = () => Date.now() - t0;
  let currentStep = 'init';
  const trace: Array<{ time: string; step: string; info?: any }> = [];
  const push = (step: string, info?: any) => {
    currentStep = step;
    const entry = { time: new Date().toISOString(), step: `${step} (+${elapsed()}ms)`, info };
    trace.push(entry);
    // consola
    if (step.startsWith('error')) console.error('[deleteUser]', entry);
    else console.log('[deleteUser]', entry);
  };

  try {
    await db.$transaction(async (tx) => {
      push('load_user.start', { userId: id });
      const user = await tx.user.findUnique({
        where: { id },
        select: { email: true, apiKeyId: true },
      });
      push('load_user.done', { email: user?.email, hasApiKey: !!user?.apiKeyId });

      let userApiKey: { key: string } | null = null;
      if (user?.apiKeyId) {
        push('load_api_key.start');
        userApiKey = await tx.apiKey.findUnique({
          where: { id: user.apiKeyId },
          select: { key: true },
        });
        push('load_api_key.done', { hasKey: !!userApiKey?.key });
      }

      push('load_sessions.start');
      const sessions = await tx.session.findMany({
        where: { userId: id },
        select: { id: true, instanceId: true, remoteJid: true },
      });
      const instanceIds = sessions.map(s => s.instanceId).filter(Boolean);
      const remoteJids = sessions.map(s => s.remoteJid).filter(Boolean);
      push('load_sessions.done', { sessions: sessions.length, instanceIds: instanceIds.length, remoteJids: remoteJids.length });

      push('load_instancias.start');
      const instancias = await tx.instancias.findMany({
        where: { userId: id },
        select: { instanceName: true },
      });
      const instanceNames = instancias.map(i => i.instanceName).filter(Boolean);
      push('load_instancias.done', { instanceNames: instanceNames.length });

      // Resellers
      push('delete_reseller.as_client.start');
      const delResClient = await tx.reseller.deleteMany({ where: { userId: id } });
      push('delete_reseller.as_client.done', { count: delResClient.count });

      push('delete_reseller.as_reseller.start');
      const delResReseller = await tx.reseller.deleteMany({ where: { resellerid: id } });
      push('delete_reseller.as_reseller.done', { count: delResReseller.count });

      // Workflows + Nodes + rr
      push('workflows.fetch.start');
      const workflows = await tx.workflow.findMany({ where: { userId: id } });
      const workflowIds = workflows.map(w => w.id);
      push('workflows.fetch.done', { count: workflowIds.length });

      if (workflowIds.length > 0) {
        push('workflow_nodes.delete.start');
        const dNodes = await tx.workflowNode.deleteMany({ where: { workflowId: { in: workflowIds } } });
        push('workflow_nodes.delete.done', { count: dNodes.count });

        push('rr.by_workflow.delete.start');
        const dRrWf = await tx.rr.deleteMany({ where: { workflowId: { in: workflowIds } } });
        push('rr.by_workflow.delete.done', { count: dRrWf.count });
      }

      push('rr.by_user.delete.start');
      const dRrUser = await tx.rr.deleteMany({ where: { userId: id } });
      push('rr.by_user.delete.done', { count: dRrUser.count });

      // Triggers / Histories by instanceIds
      if (instanceIds.length > 0) {
        push('sessionTrigger.delete.start');
        const dTrig = await tx.sessionTrigger.deleteMany({ where: { sessionId: { in: instanceIds } } });
        push('sessionTrigger.delete.done', { count: dTrig.count });

        push('n8n_chat_histories.delete.start');
        const dHist = await tx.n8n_chat_histories.deleteMany({ where: { session_id: { in: instanceIds } } });
        push('n8n_chat_histories.delete.done', { count: dHist.count });
      } else {
        push('sessionTrigger/n8n_chat_histories.skip', { reason: 'no instanceIds' });
      }

      // Reminders
      push('reminders.delete.start');
      const dRem = await tx.reminders.deleteMany({ where: { userId: id } });
      push('reminders.delete.done', { count: dRem.count });

      // VerificationToken por email
      if (user?.email) {
        push('verification_tokens.delete.start', { identifier: user.email });
        const dVer = await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
        push('verification_tokens.delete.done', { count: dVer.count });
      } else {
        push('verification_tokens.skip', { reason: 'no user.email' });
      }

      // PromptInstance (sin cascade)
      push('promptInstance.delete.start');
      const dPI = await tx.promptInstance.deleteMany({ where: { userId: id } });
      push('promptInstance.delete.done', { count: dPI.count });

      // Appointment (antes de Service para no violar FK hacia serviceId)
      push('appointments.delete.start');
      const dApp = await tx.appointment.deleteMany({ where: { userId: id } });
      push('appointments.delete.done', { count: dApp.count });

      // Services (sin cascade en schema actual)
      push('services.delete.start');
      const dSrv = await tx.service.deleteMany({ where: { userId: id } });
      push('services.delete.done', { count: dSrv.count });

      // Seguimientos (sin FK; borra por señales)
      push('seguimientos.delete.start');
      const orSeguimientos: any[] = [];
      if (remoteJids.length) orSeguimientos.push({ remoteJid: { in: remoteJids } });
      if (instanceNames.length) orSeguimientos.push({ instancia: { in: instanceNames } });
      if (userApiKey?.key) orSeguimientos.push({ apikey: userApiKey.key });

      if (orSeguimientos.length) {
        const dSeg = await tx.seguimientos.deleteMany({ where: { OR: orSeguimientos } });
        push('seguimientos.delete.done', { count: dSeg.count });
      } else {
        push('seguimientos.skip', { reason: 'no signals (remoteJids/instanceNames/apiKey)' });
      }

      // Usuario al final (activará cascadas existentes)
      push('user.delete.start');
      const dUser = await tx.user.delete({ where: { id } });
      push('user.delete.done', { deletedUserId: dUser.id });

      // Limpieza ApiKey huérfana (si procede)
      if (user?.apiKeyId) {
        push('apikey.cleanup.start');
        const dApi = await tx.apiKey.deleteMany({
          where: { id: user.apiKeyId, Users: { none: {} } },
        });
        push('apikey.cleanup.done', { count: dApi.count });
      } else {
        push('apikey.cleanup.skip', { reason: 'no user.apiKeyId' });
      }
    });

    // Log persistente (fuera de la transacción)
    await db.log.create({
      data: {
        level: 'info',
        message: `deleteUser completed`,
        context: JSON.stringify({ userId: id, trace }),
      },
    });

    revalidatePath("/admin/clientes");
    return { success: true, message: 'User and all related data deleted successfully.', debugStep: currentStep };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const payload = { userId: id, step: currentStep, error: errMsg, trace };

    console.error('[deleteUser] ERROR', payload);

    // Intentar guardar log persistente del error
    try {
      await db.log.create({
        data: {
          level: 'error',
          message: `deleteUser failed at step ${currentStep}: ${errMsg}`,
          context: JSON.stringify(payload),
        },
      });
    } catch (logErr) {
      console.error('[deleteUser] failed to persist error log', logErr);
    }

    return { success: false, message: 'Failed to delete user and related data.', debugStep: currentStep };
  }
}
