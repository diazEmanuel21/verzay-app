'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    PatchSectionSchema,
    SaveSchema,
    PublishSchema,
    RevertSchema,
    BusinessDraftSchema,
    TrainingDraftSchema,
    SectionsDraftSchema,
    FaqDraftSchema,
    ProductsDraftSchema,
    ExtrasDraftSchema,
    SectionsStrictSchema,
} from '@/types/agentAi';
import { composePromptFromSections } from '@/app/(root)/ai/_components/helpers/composePromptFromSections';
import { denormalizeBusiness } from '@/app/(root)/ai/_components/helpers/denormalizeBusiness';
import { nextRevisionNumber } from '@/app/(root)/ai/_components/helpers/nextRevisionNumber';

type Ok<T> = { ok: true; data: T };
type Conflict<T = any> = { ok: false; conflict: true; data: T };
type Fail = { ok: false; error: string };

/* =========================
   Actions públicas
========================= */
export async function patchBusinessSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof BusinessDraftSchema>;
}) {
    const { promptId, version, data } = input;

    // Zod completa defaults y normaliza aquí
    const parsed = BusinessDraftSchema.parse(data);

    const result = await patchSection({
        promptId,
        version,
        sectionKey: "business",
        patch: parsed,
    });

    return result;
}

export async function patchTrainingSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof TrainingDraftSchema>;
}) {
    const { promptId, version, data } = input;

    // Normaliza + valida la **sección** de training
    const parsed = TrainingDraftSchema.parse({
        // Permite enviar solo steps desde el cliente
        id: "",
        title: "",
        mainMessage: "",
        openPicker: false,
        ...data,
    });

    return await patchSection({
        promptId,
        version,
        sectionKey: "training",
        patch: parsed, // ← sección completa (al menos { steps })
    });
}

export async function patchFaqSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof FaqDraftSchema>;
}) {
    const { promptId, version, data } = input;

    const parsed = FaqDraftSchema.parse({
        items: [],
        ...data,
    });

    return await patchSection({
        promptId,
        version,
        sectionKey: "faq",
        patch: parsed, // { items: [...] }
    });
}

export async function patchProductsSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof ProductsDraftSchema>;
}) {
    const { promptId, version, data } = input;

    // normaliza + valida con Draft
    const parsed = ProductsDraftSchema.parse({
        items: [],
        ...data,
    });

    return await patchSection({
        promptId,
        version,
        sectionKey: "products",
        patch: parsed, // { items: [...] }
    });
}

export async function patchExtrasSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof ExtrasDraftSchema>; // { firmaEnabled?, firmaText?, items? }
}) {
    const { promptId, version, data } = input;

    // Normaliza con Draft (defaults seguros)
    const parsed = ExtrasDraftSchema.parse({
        firmaEnabled: false,
        firmaText: "",
        items: [],
        ...data,
    });

    return await patchSection({
        promptId,
        version,
        sectionKey: "extras",
        patch: parsed,
    });
}

/** Obtiene o crea el draft del agente. */
export async function getOrCreatePrompt(opts: { userId: string; agentId?: string }) {
    const { userId, agentId } = opts;

    let prompt = await db.agentPrompt.findFirst({
        where: { userId, agentId: agentId ?? undefined },
    });

    if (!prompt) {
        // estado inicial mínimo
        const emptySections = {
            business: {
                nombre: '',
                sector: '',
                ubicacion: '',
                horarios: '',
                maps: '',
                telefono: '',
                email: '',
                sitio: '',
                facebook: '',
                instagram: '',
                tiktok: '',
                youtube: '',
                notas: '',
            },
            training: { steps: [] },
            faq: { items: [] },
            products: { items: [] },
            extras: { firmaEnabled: false, firmaText: '', items: [] },
        };

        prompt = await db.agentPrompt.create({
            data: {
                userId,
                agentId,
                status: 'draft',
                sections: emptySections,
                promptText: composePromptFromSections(SectionsDraftSchema.parse(emptySections)),
                businessName: '',
                businessSector: '',
            },
        });
    }

    return prompt;
}

/** Obtiene el prompt por id (rehidratación de UI). */
export async function getCurrentPrompt(promptId: string) {
    return db.agentPrompt.findUnique({
        where: { id: promptId },
    });
}

/** Aplica un patch de una sección con optimistic locking. */
export async function patchSection(input: z.infer<typeof PatchSectionSchema>) {
    const { promptId, version, sectionKey, patch } = PatchSectionSchema.parse(input);

    return await db.$transaction(async (tx) => {
        const current = await tx.agentPrompt.findUnique({ where: { id: promptId } });
        if (!current) throw new Error('Prompt no encontrado');

        if (current.version !== version) {
            // Conflicto de versión
            return { ok: false as const, conflict: true as const, data: current };
        }

        // Validar + merge en JS (más seguro que depender de operadores JSONB en Prisma)
        const sections = current.sections as unknown as z.infer<typeof SectionsDraftSchema>;
        const parsed = SectionsDraftSchema.parse(sections);

        // Aplica patch validando contra el schema específico
        const next = { ...parsed };
        switch (sectionKey) {
            case 'business':
                next.business = BusinessDraftSchema.parse({ ...parsed.business, ...(patch || {}) });
                break;
            case 'training':
                next.training = TrainingDraftSchema.parse({ ...parsed.training, ...(patch || {}) });
                break;
            case 'faq':
                next.faq = FaqDraftSchema.parse({ ...parsed.faq, ...(patch || {}) });
                break;
            case 'products':
                next.products = ProductsDraftSchema.parse({ ...parsed.products, ...(patch || {}) });
                break;
            case 'extras':
                next.extras = ExtrasDraftSchema.parse({ ...parsed.extras, ...(patch || {}) });
                break;
        }

        const updated = await tx.agentPrompt.update({
            where: { id: promptId },
            data: {
                sections: next,
                version: { increment: 1 },
                // Denormalizados para listados
                businessName: next.business.nombre || null,
                businessSector: next.business.sector || null,
            },
        });

        return { ok: true as const, conflict: false as const, data: updated };
    });
}

/** Recompone y guarda el prompt derivado (sin publicar). */
export async function savePrompt(input: z.infer<typeof SaveSchema>) {
    try {
        const { promptId, version, revalidate } = SaveSchema.parse(input);

        const current = await db.agentPrompt.findUnique({
            where: { id: promptId },
        });
        if (!current) return { ok: false, error: "Prompt no encontrado" } as Fail;

        // Control de concurrencia optimista
        if (current.version !== version) {
            return { ok: false, conflict: true, data: current } as Conflict<typeof current>;
        }

        // Normaliza con Draft (limpia UI-only keys si tus DraftSchemas así lo hacen)
        const draft = SectionsDraftSchema.parse(current.sections);
        const promptText = composePromptFromSections(draft);

        const { businessName, businessSector } = denormalizeBusiness(draft);

        const updated = await db.agentPrompt.update({
            where: { id: promptId },
            data: {
                promptText,
                businessName,
                businessSector,
                version: { increment: 1 },
            },
        });

        if (revalidate) revalidatePath(revalidate);

        return { ok: true, data: updated } as Ok<typeof updated>;
    } catch (e: any) {
        return { ok: false, error: e?.message ?? "Error al guardar prompt" } as Fail;
    }
}

/** Publica (crea revisión) + deja el draft sincronizado. */
export async function publishPrompt(input: z.infer<typeof PublishSchema>) {
    try {
        const { promptId, version, publishedBy, note, revalidate } = PublishSchema.parse(input);

        const result = await db.$transaction(async (tx) => {
            const current = await tx.agentPrompt.findUnique({ where: { id: promptId } });
            if (!current) return { ok: false, error: "Prompt no encontrado" } as Fail;

            // Concurrencia
            if (current.version !== version) {
                return { ok: false, conflict: true, data: current } as Conflict<typeof current>;
            }

            // Validación estricta antes de publicar
            const strict = SectionsStrictSchema.parse(current.sections);
            const normalizedForCompose = SectionsDraftSchema.parse(strict);
            const promptTextStrict = composePromptFromSections(normalizedForCompose);

            const { businessName, businessSector } = denormalizeBusiness(strict);

            // Crea revisión (snapshot)
            const revNumber = await nextRevisionNumber(promptId);
            const revision = await tx.agentPromptRevision.create({
                data: {
                    promptId,
                    revisionNumber: revNumber,
                    sectionsSnapshot: strict,            // snapshot exacto publicado
                    promptTextSnapshot: promptTextStrict,
                    publishedBy: publishedBy,
                    notes: note ?? null,
                },
            });

            // Marca prompt como publicado y actualiza promptText + denormalizados
            const updated = await tx.agentPrompt.update({
                where: { id: promptId },
                data: {
                    status: "published",
                    promptText: promptTextStrict,
                    businessName,
                    businessSector,
                    version: { increment: 1 },
                },
            });

            return { ok: true, data: { prompt: updated, revision } } as Ok<{ prompt: typeof updated; revision: typeof revision }>;
        });

        if (result.ok && input.revalidate) {
            revalidatePath(input.revalidate);
        }

        return result;
    } catch (e: any) {
        return { ok: false, error: e?.message ?? "Error al publicar prompt" } as Fail;
    }
}


/** Lista revisiones (paginable si quieres) */
export async function listRevisions(promptId: string) {
    return db.agentPromptRevision.findMany({
        where: { promptId },
        orderBy: { revisionNumber: 'desc' },
    });
}


export async function revertToRevision(input: z.infer<typeof RevertSchema>) {
    try {
        const { promptId, revisionNumber, revalidate } = RevertSchema.parse(input);

        const result = await db.$transaction(async (tx) => {
            const rev = await tx.agentPromptRevision.findFirst({
                where: { promptId, revisionNumber },
            });
            if (!rev) return { ok: false, error: "Revisión no encontrada" } as Fail;

            // Por seguridad, valida el snapshot como Draft (o Strict si así lo prefieres)
            const draft = SectionsDraftSchema.parse(rev.sectionsSnapshot);
            const promptText = composePromptFromSections(draft);
            const { businessName, businessSector } = denormalizeBusiness(draft);

            const updated = await tx.agentPrompt.update({
                where: { id: promptId },
                data: {
                    sections: draft,                // restauramos snapshot
                    promptText,
                    status: "draft",                // recomendado: vuelve a borrador
                    businessName,
                    businessSector,
                    version: { increment: 1 },
                },
            });

            return { ok: true, data: updated } as Ok<typeof updated>;
        });

        if (result.ok && revalidate) {
            revalidatePath(revalidate);
        }

        return result;
    } catch (e: any) {
        return { ok: false, error: e?.message ?? "Error al revertir a la revisión" } as Fail;
    }
}
