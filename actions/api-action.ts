'use server';

import { db } from "@/lib/db";
import { ApiKey } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto"; // <--- IMPORTANTE: Añadido para generar IDs locales

/* ==================================
0. Tipos de Interfaz
================================== */

interface GenerateQrInterface {
    instanceName: string
    userId: string
}
interface ClientResponse<T = undefined> {
    success: boolean
    message: string
    data?: T
}
interface QRCodeResponse {
    qr?: {
        code: string;
        pairingCode?: string;
    };
    connectionState?: {
        instance: {
            state: string;
        };
    };
    success: boolean;
    message?: string;
}

/* ==================================
1. Utilidades Auxiliares
================================== */

function normalizeBaseUrl(url: string): string {
    const trimmed = (url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return trimmed;
}

export async function checkActiveInstance(userId: string, tipoInstancia: string = 'Whatsapp') {
    const instanciaActiva = await db.instancias.findFirst({
        where: { userId, tipoInstancia: tipoInstancia },
    });
    return instanciaActiva;
}

/* ==================================
2. Server Actions: Instancias y QR (LÓGICA CONDICIONAL AÑADIDA)
================================== */

export async function generateQRCode({ instanceName, userId }: GenerateQrInterface): Promise<QRCodeResponse> {
    console.log(`[QR_GEN_START] Iniciando solicitud de QR para instancia: "${instanceName}", Usuario ID: ${userId}`);

    try {
        // ==============================================================================
        // NUEVA LÓGICA: Primero, verificar el tipo de instancia desde la base de datos
        // ==============================================================================
        console.log(`[QR_GEN_DB] Verificando tipo de la instancia "${instanceName}" en la base de datos.`);
        const instancia = await db.instancias.findFirst({
            where: { instanceName, userId },
            select: { tipoInstancia: true }
        });

        if (!instancia) {
            console.error(`[QR_GEN_FAIL] La instancia "${instanceName}" no fue encontrada para el usuario ${userId}.`);
            throw new Error("Instancia no encontrada.");
        }

        // Si la instancia no es de Whatsapp (o null), no se puede generar QR.
        const esTipoWhatsapp = !instancia.tipoInstancia || instancia.tipoInstancia === 'Whatsapp';
        if (!esTipoWhatsapp) {
            console.warn(`[QR_GEN_SKIP] Se denegó la generación de QR. La instancia "${instanceName}" es de tipo "${instancia.tipoInstancia}", no de Whatsapp.`);
            return {
                success: false,
                message: `La generación de QR solo está disponible para instancias de tipo Whatsapp.`,
            };
        }
        // ==============================================================================
        // FIN DE LA NUEVA LÓGICA
        // ==============================================================================
        
        console.log(`[QR_GEN_INFO] La instancia es de tipo Whatsapp. Procediendo a contactar Evolution API.`);

        // 1. Buscar usuario y su ApiKey en la BD
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { apiKey: true },
        });

        // 2. Validaciones
        if (!user) throw new Error(`El userId "${userId}" no existe.`);
        if (!user.apiKey) throw new Error(`El usuario ${user.email} no tiene una ApiKey asignada.`);
        console.log(`[QR_GEN_DB] ApiKey encontrada para el usuario.`);

        // 3. Preparar y ejecutar llamada a la API de Evolution
        const { key: apiKey, url: serverUrlRaw } = user.apiKey;
        const serverUrl = normalizeBaseUrl(serverUrlRaw);
        const evolutionApiUrl = `https://${serverUrl}/instance/connect/${instanceName}`;

        console.log(`[QR_GEN_API_CALL] Preparando llamada GET a: ${evolutionApiUrl}`);
        const response = await fetch(evolutionApiUrl, {
            method: 'GET',
            headers: { apikey: apiKey },
        });
        console.log(`[QR_GEN_API_RESPONSE] Respuesta recibida de Evolution API. Status: ${response.status}`);

        // 4. Procesar respuesta
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Respuesta de error no es JSON.' }));
            throw new Error(errorData.message || 'Error al conectar con la instancia.');
        }

        const data = await response.json();
        if (data.base64) {
            return { success: true, qr: { code: data.base64, pairingCode: data.pairingCode } };
        } else if (data.instance?.state === 'open') {
            return { success: true, connectionState: { instance: { state: 'open' } }, message: 'Instancia ya conectada.' };
        } else {
            return { success: false, message: data.message || 'No se pudo generar el código QR.' };
        }
    } catch (error: any) {
        console.error(`[QR_GEN_CATCH_ERROR] Error crítico en generateQRCode para "${instanceName}":`, error.message);
        return { success: false, message: error.message || 'Error interno al generar el código QR.' };
    }
}

export async function createInstance(data: FormData) {
    const instanceName = data.get('instanceName') as string;
    const tipoInstancia = data.get('tipoInstancia') as string;
    const userId = data.get('userId') as string;
    
    console.log(`[INSTANCE_CREATE_START] Nombre: "${instanceName}", Tipo: "${tipoInstancia}", Usuario ID: ${userId}`);

    try {
        if (!instanceName || !userId || !tipoInstancia) throw new Error('Todos los campos son obligatorios');

        const instanciaActiva = await checkActiveInstance(userId, tipoInstancia);
        if (instanciaActiva) {
            return { success: false, message: `El usuario ya tiene una instancia activa de tipo "${tipoInstancia}".`, instancia: instanciaActiva };
        }

        let instanceId: string;
        let apiResult: any = null; // Para almacenar la respuesta de la API si se llama

        // ==============================================================================
        // NUEVA LÓGICA: Bifurcación basada en el tipo de instancia
        // ==============================================================================
        const esTipoWhatsapp = tipoInstancia === 'Whatsapp' || tipoInstancia === null;

        if (esTipoWhatsapp) {
            // --- CAMINO 1: Es Whatsapp, se contacta a Evolution API ---
            console.log(`[INSTANCE_CREATE_INFO] Tipo de instancia es "${tipoInstancia}". Se contactará a Evolution API.`);

            const user = await db.user.findUnique({
                where: { id: userId },
                include: { apiKey: true },
            });
            if (!user || !user.apiKey) throw new Error("El usuario no tiene una ApiKey asignada para crear instancias de Whatsapp.");
            
            const { key: apiKey, url: serverUrlRaw } = user.apiKey;
            const serverUrl = normalizeBaseUrl(serverUrlRaw);
            const evolutionApiUrl = `https://${serverUrl}/instance/create`;
            
            const requestBody = { instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" };
            const options = {
                method: 'POST',
                headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            };

            console.log(`[INSTANCE_CREATE_API_CALL] Llamando a: ${evolutionApiUrl}`);
            const response = await fetch(evolutionApiUrl, options);
            apiResult = await response.json();
            
            if (!response.ok) throw new Error(apiResult.message || 'Error al crear la instancia en la API.');
            
            instanceId = apiResult.hash;
            if (!instanceId) throw new Error('No se recibió instanceId (hash) en la respuesta de la API.');
            
            console.log(`[INSTANCE_CREATE_API_SUCCESS] Instancia creada en Evolution. instanceId: ${instanceId}`);

        } else {
            // --- CAMINO 2: No es Whatsapp, solo se crea en la base de datos local ---
            console.log(`[INSTANCE_CREATE_INFO] Tipo de instancia es "${tipoInstancia}". Se creará solo en la base de datos local.`);
            instanceId = randomUUID(); // Generamos un ID único localmente
            console.log(`[INSTANCE_CREATE_DB_ONLY] Se generó un ID local para la instancia: ${instanceId}`);
        }
        // ==============================================================================
        // FIN DE LA NUEVA LÓGICA
        // ==============================================================================

        // Guardar la nueva instancia en la base de datos (común para ambos caminos)
        console.log(`[INSTANCE_CREATE_DB_SAVE] Guardando nueva instancia en la base de datos local...`);
        const nuevaInstancia = await db.instancias.create({
            data: { instanceName, tipoInstancia, userId, instanceId },
        });
        console.log(`[INSTANCE_CREATE_DB_SAVE_SUCCESS] Instancia guardada en DB con ID: ${nuevaInstancia.id}`);
        
        revalidatePath('/agregar-api');
        console.log("[INSTANCE_CREATE_END] Proceso completado exitosamente.");
        
        return { 
            success: true, 
            message: "Instancia creada exitosamente.", 
            instancia: nuevaInstancia, 
            ...(apiResult && { apiResult }) // Añadir apiResult solo si existe
        };
        
    } catch (error: any) {
        console.error("[INSTANCE_CREATE_CATCH_ERROR] Error crítico en createInstance:", error.message);
        return { success: false, message: error.message || "Error al crear la instancia." };
    }
}

/**
 * Esta función ya tenía la lógica correcta, se mantiene sin cambios.
 * Solo realiza llamadas a Evolution API si la instancia es de tipo 'Whatsapp' o nula.
 */
export async function deleteInstance(userId: string, tipoInstancia?: string | null) {
    console.log(`[DELETE START] Iniciando borrado para userId: ${userId}, tipoInstancia recibido: ${tipoInstancia}`);
    try {
        const finalTipoInstancia = tipoInstancia ?? 'Whatsapp';
        let whereClause: any = { userId };
        
        if (finalTipoInstancia === 'Whatsapp') {
            whereClause = {
                userId,
                OR: [{ tipoInstancia: 'Whatsapp' }, { tipoInstancia: null }]
            };
        } else {
            whereClause.tipoInstancia = finalTipoInstancia;
        }
        
        const instancias = await db.instancias.findMany({
            where: whereClause,
            select: { id: true, instanceName: true, tipoInstancia: true }
        });

        if (instancias.length === 0) {
            return { success: false, message: `El usuario no tiene instancias del tipo solicitado para eliminar.` };
        }
        
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { apiKey: true },
        });

        const userApiKey = user?.apiKey;
        const hasApiKey = !!userApiKey;
        const serverUrl = hasApiKey ? normalizeBaseUrl(userApiKey!.url) : null;
        const apiKey = hasApiKey ? userApiKey!.key : null;
        
        let apiDeleteSuccessCount = 0;

        for (const instancia of instancias) {
            const shouldCallEvolutionAPI = hasApiKey && (!instancia.tipoInstancia || instancia.tipoInstancia === 'Whatsapp');

            if (shouldCallEvolutionAPI) {
                console.log(`[DELETE API] Intentando borrar instancia Evolution: ${instancia.instanceName}`);
                const deleteOptions = {
                    method: 'DELETE',
                    headers: { 'apikey': apiKey! }
                };
                const deleteResponse = await fetch(`https://${serverUrl!}/instance/delete/${instancia.instanceName}`, deleteOptions);

                if (deleteResponse.ok) {
                    apiDeleteSuccessCount++;
                    console.log(`[DELETE SUCCESS] API borrada para ${instancia.instanceName}.`);
                } else {
                    console.warn(`[DELETE FAIL] Fallo al borrar API para ${instancia.instanceName}.`);
                }
            } else {
                console.log(`[DELETE SKIP] Saltando llamada API para ${instancia.instanceName} (Solo DB)`);
            }
        }

        const deletedCount = await db.instancias.deleteMany({ where: whereClause });
        revalidatePath('/');
        return { success: true, message: `Se eliminaron ${deletedCount.count} instancias.` };

    } catch (error: any) {
        console.error(`[DELETE ERROR] Error crítico: ${error.message}`);
        return { success: false, message: error.message || "Error al eliminar las instancias." };
    }
}


export async function getInstances(userId: string) {
    try {
        const instancesFromDb = await db.instancias.findMany({
            where: { userId: userId },
            select: { instanceName: true, instanceId: true },
        });

        const user = await db.user.findUnique({
            where: { id: userId },
            include: { apiKey: true },
        });

        if (!user || !user.apiKey) throw new Error("El usuario no tiene una ApiKey asignada.");

        const { url: serverUrlRaw } = user.apiKey;
        const serverUrl = normalizeBaseUrl(serverUrlRaw);

        const instances = instancesFromDb.map((instance) => ({
            ...instance,
            serverUrl
        }));

        return instances;

    } catch (error) {
        console.error(`Error fetching instances:`, error);
        return []; // Devolver un array vacío en caso de error
    }
}

/* ==================================
3. Server Actions: API Keys (Sin cambios)
================================== */

export async function agregarApi(data: FormData): Promise<ClientResponse<ApiKey>> {
    const url = data.get('url') as string
    const key = data.get('key') as string
    if (!url || !key) return { success: false, message: 'Todos los campos son obligatorios' }
    try {
        const createdApiKey = await db.apiKey.create({ data: { url, key } })
        return { success: true, message: 'API Key agregada exitosamente', data: createdApiKey }
    } catch (error: any) {
        return { success: false, message: error.message || 'Error al agregar la API Key' }
    }
}

export async function editarApiKey(data: FormData): Promise<ClientResponse<ApiKey>> {
    const id = data.get('id') as string
    const url = data.get('url') as string
    const key = data.get('key') as string
    if (!url || !key || !id) return { success: false, message: 'Todos los campos son obligatorios' }
    try {
        await db.apiKey.update({ where: { id }, data: { url, key } });
        return { success: true, message: "API Key actualizada exitosamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al actualizar la API Key." };
    }
}

export async function eliminarApiKey(id: string) {
    if (!id) return { success: false, message: 'No se encontró el id' }
    try {
        await db.apiKey.delete({ where: { id } });
        revalidatePath('/agregar-api');
        return { success: true, message: "API Key eliminada exitosamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al eliminar la API Key." };
    }
}

export async function obtenerApiKeys() {
    try {
        const apiKeys = await db.apiKey.findMany();
        return { success: true, data: apiKeys };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al obtener las API Keys." };
    }
}

export async function getApiKeyById(id: string) {
    try {
        if (!id) return { success: false, message: 'Missing id' };
        const apiKey = await db.apiKey.findUnique({ where: { id } });
        return { success: true, data: apiKey };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al obtener la API Key." };
    }
}

/* ==================================
4. Server Actions: Bot y Status (Sin cambios)
================================== */

export async function createBotAction(data: FormData) {
    const instanceName = data.get('instanceName') as string;
    const instanceId = data.get('instanceId') as string;
    const systemMessage = data.get('systemMessage') as string;

    if (!instanceName || !instanceId || !systemMessage) throw new Error('Faltan datos necesarios.');

    const requestBody = {
        enabled: true,
        openaiCredsId: 'cm2nql5yd6e7g12gecbdrflit',
        botType: 'chatCompletion',
        model: 'gpt-4',
        systemMessages: [systemMessage],
        // ... resto de las propiedades del bot
    };

    try {
        const response = await fetch(`https://conexion.aizenbots.com/openai/create/${instanceName}`, {
            method: 'POST',
            headers: { 'apikey': instanceId, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear el bot');
        }
        return await response.json();
    } catch (err) {
        console.error(`Error en createBotAction:`, err);
    }
}

export async function getDataApi(userId: string, apiKeyId: string) {
    try {
        const apiKey = await db.apiKey.findFirst({
            where: { id: apiKeyId },
            select: { id: true, url: true, key: true },
        });
        const instancia = await db.instancias.findFirst({
            where: { userId },
            select: { id: true, instanceName: true, instanceId: true },
        });

        if (!apiKey || !instancia) {
            return { success: false, data: null, message: "No se encontró ApiKey o Instancia." };
        }

        return {
            success: true,
            data: {
                apiKeyId: apiKey.id,
                url: apiKey.url,
                key: instancia.instanceId,
                instanceName: instancia.instanceName,
                instanceId: instancia.instanceId,
            },
        };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al obtener datos de la API." };
    }
}