// lib/auth.ts
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Cache para la duración de la request
const userCache = new WeakMap<Request, Promise<any>>();

export async function currentUser(request?: Request) {
    // Si tenemos cache para esta request, la usamos
    if (request && userCache.has(request)) {
        return userCache.get(request);
    }

    const session = await auth();
    if (!session?.user?.email) return null;

    const userPromise = db.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            company: true,
            notificationNumber: true,
            apiUrl: true,
            apiKey: true,
            image: true,
            plan: true,
            webhookUrl: true,
            apiKeyId: true,
            instancias: true,
            onFacebook: true,
            onInstagram: true,
            meetingDuration: true,
            timezone: true,
            meetingUrl: true,
            // Solo selecciona los campos necesarios
        },
    });

    if (request) {
        userCache.set(request, userPromise);
    }

    return userPromise;
}