
'use server'

interface SendingMessages {
    url: string
    apikey: string
    remoteJid: string
    text: string
};

/**
 * Send message type text
 *
 * @param {string} url - `${urlevo}/message/sendText/${instanceName}`.
 * @param {string} apikey - 58900D6F-2692-5B41-A047-57BEF8717B26.
 * @param {string} remoteJid - 573107964105@s.whatsapp.net.
 * @param {string} text - message.
 * @returns {{ success: boolean; message: string }} - Resultado del envío.
 */
export const sendingMessages = async ({
    url,
    apikey,
    remoteJid,
    text,
}: SendingMessages): Promise<{ success: boolean; message: string }> => {
    console.log({ url, apikey, remoteJid, text });

    try {
        const body = {
            number: remoteJid,
            delay: 1200,
            text,
        };

        console.log(`Enviando texto a ${remoteJid}`, 'NodeSenderService');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = `Error HTTP: ${response.status}`;
            console.error(errorText);
            return { success: false, message: errorText };
        }

        const data = await response.json();
        console.log(`Respuesta ${remoteJid}: ${JSON.stringify(data)}`, 'NodeSenderService');
        return { success: true, message: 'Mensaje enviado correctamente.' };

    } catch (error: any) {
        const errMsg = `Error enviando texto a ${remoteJid}: ${error.message || error}`;
        console.error(errMsg);
        return { success: false, message: errMsg };
    }
};
