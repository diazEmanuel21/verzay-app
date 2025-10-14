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
} from '@/types/agentAi';
import { composePromptFromSections } from '@/app/(root)/ai/_components/helpers/composePromptFromSections';

/* =========================
   Actions públicas
========================= */
// actions/system-prompt-actions.ts
export async function patchBusinessSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof BusinessDraftSchema>;
}) {
    "use server";
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

// actions/system-prompt-actions.ts
export async function patchTrainingSection(input: {
    promptId: string;
    version: number;
    data: z.input<typeof TrainingDraftSchema>;
}) {
    "use server";
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
    const { promptId, version, revalidate } = SaveSchema.parse(input);

    const updated = await db.$transaction(async (tx) => {
        const current = await tx.agentPrompt.findUnique({ where: { id: promptId } });
        if (!current) throw new Error('Prompt no encontrado');
        if (current.version !== version) throw new Error('Conflicto de versión');

        const sections = SectionsDraftSchema.parse(current.sections as any);
        const promptText = composePromptFromSections(sections);

        return tx.agentPrompt.update({
            where: { id: promptId },
            data: {
                promptText,
                version: { increment: 1 },
                businessName: sections.business.nombre || null,
                businessSector: sections.business.sector || null,
            },
        });
    });

    if (revalidate) revalidatePath(revalidate);
    return updated;
}

/** Publica (crea revisión) + deja el draft sincronizado. */
export async function publishPrompt(input: z.infer<typeof PublishSchema>) {
    const { promptId, version, note, publishedBy, revalidate } = PublishSchema.parse(input);

    const result = await db.$transaction(async (tx) => {
        const current = await tx.agentPrompt.findUnique({ where: { id: promptId } });
        if (!current) throw new Error('Prompt no encontrado');
        if (current.version !== version) throw new Error('Conflicto de versión');

        const sections = SectionsDraftSchema.parse(current.sections as any);
        const promptText = composePromptFromSections(sections);

        // siguiente número de revisión
        const last = await tx.agentPromptRevision.findFirst({
            where: { promptId },
            orderBy: { revisionNumber: 'desc' },
            select: { revisionNumber: true },
        });
        const nextRevision = (last?.revisionNumber ?? 0) + 1;

        const updated = await tx.agentPrompt.update({
            where: { id: promptId },
            data: {
                promptText,
                status: 'published',
                version: { increment: 1 },
                businessName: sections.business.nombre || null,
                businessSector: sections.business.sector || null,
            },
        });

        const rev = await tx.agentPromptRevision.create({
            data: {
                promptId,
                revisionNumber: nextRevision,
                sectionsSnapshot: sections,
                promptTextSnapshot: promptText,
                publishedBy,
                notes: note ?? null,
            },
        });

        return { updated, revision: rev };
    });

    if (revalidate) revalidatePath(revalidate);
    return result;
}

/** Lista revisiones (paginable si quieres) */
export async function listRevisions(promptId: string) {
    return db.agentPromptRevision.findMany({
        where: { promptId },
        orderBy: { revisionNumber: 'desc' },
    });
}

/** Revierte el draft a una revisión concreta (y NO publica). */
export async function revertToRevision(input: z.infer<typeof RevertSchema>) {
    const { promptId, revisionNumber, revalidate } = RevertSchema.parse(input);

    const updated = await db.$transaction(async (tx) => {
        const rev = await tx.agentPromptRevision.findUnique({
            where: { promptId_revisionNumber: { promptId, revisionNumber } },
        });
        if (!rev) throw new Error('Revisión no encontrada');

        const sections = SectionsDraftSchema.parse(rev.sectionsSnapshot as any);
        const promptText = composePromptFromSections(sections);

        return tx.agentPrompt.update({
            where: { id: promptId },
            data: {
                sections,
                promptText,
                version: { increment: 1 },
                status: 'draft',
                businessName: sections.business.nombre || null,
                businessSector: sections.business.sector || null,
            },
        });
    });

    if (revalidate) revalidatePath(revalidate);
    return updated;
}