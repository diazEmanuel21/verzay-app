import { UserWithApiKeys } from "@/schema/schema";
import { Workflow } from "@prisma/client";
import { ChangeEvent } from "react";
import z from "zod";



/* =========================
   0) Zod Schemas (payloads)
========================= */

export const SectionKeySchema = z.enum(['business', 'training', 'faq', 'products', 'extras']);

/* ---------- DRAFT (para edición/autosave) ---------- */
export const BusinessDraftSchema = z.object({
    nombre: z.string().optional().default(""),
    sector: z.string().optional().default(""),
    ubicacion: z.string().optional().default(""),
    horarios: z.string().optional().default(""),
    maps: z.string().optional().default(""),
    telefono: z.string().optional().default(""),
    email: z.string().optional().default(""),
    sitio: z.string().optional().default(""),
    facebook: z.string().optional().default(""),
    instagram: z.string().optional().default(""),
    tiktok: z.string().optional().default(""),
    youtube: z.string().optional().default(""),
    notas: z.string().optional().default(""),
});

export const TrainingDraftSchema = z.object({
    steps: z.array(
        z.object({
            id: z.string(),
            title: z.string().optional(),
            mainMessage: z.string().optional().default(""),
            elements: z.array(
                z.union([
                    z.object({
                        id: z.string(),
                        kind: z.literal("text"),
                        text: z.string().optional().default(""),
                    }),
                    z.object({
                        id: z.string(),
                        kind: z.literal("function"),
                        fn: z.enum([
                            "captura_datos",
                            "ejecutar_flujo",
                            "notificar_asesor",
                            "consulta_datos",
                        ]),
                        // ⬇️ refuerza el enum como en el type
                        subtype: z
                            .enum(["Solicitudes", "Reclamos", "Pedidos", "Reservas"])
                            .optional(),
                        prompt: z.string().optional(),
                        fields: z.array(z.string()).optional(),

                        // ⬇️ acepta null | string (coincide con tus types)
                        flowId: z.string().nullable().optional(),
                        flowName: z.string().nullable().optional(),
                        notificationNumber: z.string().nullable().optional(),
                    }),
                ])
            ).default([]),
        })
    ).default([]),
});

export const FaqDraftSchema = z.object({
    items: z.array(z.object({ id: z.string(), q: z.string().optional().default(""), a: z.string().optional().default("") })).default([]),
});

export const ProductsDraftSchema = z.object({
    items: z.array(z.object({ id: z.string(), name: z.string().optional().default(""), description: z.string().optional().default("") })).default([]),
});

export const ExtrasDraftSchema = z.object({
    firmaEnabled: z.boolean().optional().default(false),
    firmaText: z.string().optional().default(""),
    items: z.array(z.object({ id: z.string(), title: z.string().optional().default(""), content: z.string().optional().default("") })).default([]),
});

export const SectionsDraftSchema = z.object({
    business: BusinessDraftSchema,
    training: TrainingDraftSchema,
    faq: FaqDraftSchema,
    products: ProductsDraftSchema,
    extras: ExtrasDraftSchema,
});

/* ---------- STRICT (para publicar/validación fuerte) ---------- */
export const BusinessStrictSchema = z.object({
    nombre: z.string().min(1, 'nombre requerido'),
    sector: z.string().optional(),
    ubicacion: z.string().optional(),
    horarios: z.string().optional(),
    maps: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().optional(),
    sitio: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    notas: z.string().optional(),
});

export const TrainingStrictSchema = TrainingDraftSchema;
export const FaqStrictSchema = FaqDraftSchema;
export const ProductsStrictSchema = ProductsDraftSchema;
export const ExtrasStrictSchema = ExtrasDraftSchema;

export const SectionsStrictSchema = z.object({
    business: BusinessStrictSchema,
    training: TrainingStrictSchema,
    faq: FaqStrictSchema,
    products: ProductsStrictSchema,
    extras: ExtrasStrictSchema,
});

/* ---------- Schemas de acciones ---------- */
export const PatchSectionSchema = z.object({
    promptId: z.string().uuid(),
    // promptId: z.string().min(1, "promptId requerido"),
    version: z.number().int().positive(),
    sectionKey: SectionKeySchema,
    patch: z.any(), // Se valida contra los DraftSchemas según la sección en la action
});

export const SaveSchema = z.object({
    promptId: z.string().uuid(),
    version: z.number().int().positive(),
    revalidate: z.string().optional(), // ruta opcional para revalidatePath
});

// OJO: publishedBy es String (cuid), NO uuid
export const PublishSchema = z.object({
    promptId: z.string().uuid(),
    version: z.number().int().positive(),
    publishedBy: z.string(),
    note: z.string().optional(),
    revalidate: z.string().optional(),
});

export const RevertSchema = z.object({
    promptId: z.string().uuid(),
    revisionNumber: z.number().int().nonnegative(),
    revalidate: z.string().optional(),
});

/* ---------------------- Validación ligera UI (React Hook Form) ---------------------- */
export const promptSchema = z.object({
    nombre: z.string().min(1, "Requerido"),
    sector: z.string().optional().default(""),
    ubicacion: z.string().optional().default(""),
    horarios: z.string().optional().default(""),
    maps: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    telefono: z.string().optional().default(""),
    email: z.string().email("Email inválido").or(z.string().length(0)).optional(),
    sitio: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    facebook: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    instagram: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    tiktok: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    youtube: z.string().url("URL inválida").or(z.string().length(0)).optional(),
    notas: z.string().optional().default(""),
});

export type FormValues = z.infer<typeof promptSchema>;

/* ---------------------- Tipos de componentes/props ---------------------- */
export type SectionsPromptSystem = {
    business: {
        nombre: string; sector?: string; ubicacion?: string; horarios?: string;
        maps?: string; telefono?: string; email?: string; sitio?: string;
        facebook?: string; instagram?: string; tiktok?: string; youtube?: string;
        notas?: string;
    };
    training: {
        steps: Array<{
            id: string;
            title?: string;
            mainMessage?: string;
            elements: Array<
                | { id: string; kind: "text"; text: string }
                // | { id: string; kind: "function"; fn: "captura_datos"; subtype?: string; prompt?: string; fields?: string[] }
                | { id: string; kind: "function"; fn: "ejecutar_flujo"; flowId: string; flowName?: string }
                | { id: string; kind: "function"; fn: "notificar_asesor"; notificationNumber: string }
            // | { id: string; kind: "function"; fn: "consulta_datos"; prompt?: string }
            >;
        }>;
    };
    faq: {
        items: Array<{ id: string; q: string; a: string }>;
    };
    products: {
        items: Array<{ id: string; name: string; description?: string }>;
    };
    extras: {
        firmaName: string;
        firmaEnabled: boolean;
        firmaText: string;
        items: Array<{ id: string; title: string; content: string }>;
    };
};

export interface MainAiInterface {
    flows: Workflow[];
    user: UserWithApiKeys;
    promptMeta: { id: string; version: number };
}
export type MainAiProps = MainAiInterface & {
    sections: SectionsPromptSystem;
};
export interface BusinessValues {
    nombre: string;
    sector: string;
    ubicacion: string;
    horarios: string;
    maps: string;
    telefono: string;
    email: string;
    sitio: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    notas: string;
    training?: string;
    faq?: string;
    products?: string;
    more?: string;
}

export const initialValues: BusinessValues = {
    nombre: "",
    sector: "",
    ubicacion: "",
    horarios: "",
    maps: "",
    telefono: "",
    email: "",
    sitio: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    notas: "",
    training: "",
    faq: "",
    products: "",
};

export interface BusinessBuilderInterface {
    user: UserWithApiKeys;
    values: BusinessValues;
    handleChange: (
        key: keyof BusinessValues
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export type BusinessPromptBuilderProps = BusinessBuilderInterface & {
    promptId: string;
    version: number;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
};

export interface PromptPreviewInterface {
    prompt: string;
}

/******** TrainingBuilder **********/
export interface TrainingBuilderExternalProps {
    values: { training: string };
    handleChange: (
        key: "training"
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export interface TrainingBuilderProps extends TrainingBuilderExternalProps {
    flows: Workflow[];
    notificationNumber?: string;
    onChange?: (state: { mainMessage: string; elements: ElementItem[] }) => void;
    // NUEVO:
    promptId: string;
    version: number;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    initialSteps?: Array<any>; // steps desde BD (sections.training.steps)
}

/* -------------------- Tipos locales para PASOS -------------------- */
export type StepTraining = {
    id: string;
    title?: string;
    mainMessage?: string;
    elements: ElementItem[];
    openPicker?: boolean; // UI state por paso
};

export type PedidoFunctionEl = ElementFunction & {
    fn: "captura_datos";
    subtype: "Pedidos";
    prompt: string;
    fields?: string[]; // ← campos adicionales (cc, name, etc.)
};

export type ElementText = {
    id: string;
    kind: "text";
    text: string;
};

export type ElementFunction =
    | {
        id: string;
        kind: "function";
        fn: "captura_datos";
        subtype: "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas";
        prompt: string;
    }
    | {
        id: string;
        kind: "function";
        fn: "ejecutar_flujo";
        flowId: string | null;
        flowName: string | null;
    }
    | {
        id: string;
        kind: "function";
        fn: "notificar_asesor";
        notificationNumber: string | null;
    }
    | {
        id: string;
        kind: "function";
        fn: "consulta_datos";
        prompt: string;
    };

export type ElementItem = ElementText | ElementFunction;

export const CAPTURE_SNIPPETS: Record<
    "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas",
    string
> = {
    Solicitudes:
        "**Captura de Solicitudes**: Pide al usuario su requerimiento, contexto, prioridad y datos de contacto. Confirma si necesita seguimiento.",
    Reclamos:
        "**Captura de Reclamos**: Registra descripción, evidencia (foto/video), fecha, número de pedido (si aplica) y nivel de urgencia. Genera acuse.",
    Pedidos:
        "**Captura de Pedidos**: Toma producto/servicio, cantidad, variante, precio acordado (si aplica), datos de entrega y método de pago.",
    Reservas:
        "**Captura de Reservas**: Recolecta fecha, hora, sede, cantidad de personas/ítems, nombre y teléfono. Confirma disponibilidad y condiciones.",
};

export const CONSULTA_DATOS_SNIPPET = `**Consultar Productos**. Si no hay un flujo activo y el usuario pregunta por un producto, ejecuta esta herramienta.
- *Disparadores:* “imagen”, “foto”, “video”, “pdf”, “documento”, “ver”, “ver el producto”, “muéstrame”, “catálogo”.`

/*****************  FQABUILDER ***********************/
export type QaItem = { id: string; q: string; a: string };

export const PRESETS: Array<{ title: string; answer: string }> = [
    { title: "Promociones, descuentos y ofertas", answer: "Inserta aquí la respuesta oficial sobre promociones disponibles" },
    { title: "Cliente pide descuento", answer: "Inserta aquí la respuesta para solicitudes de rebaja o promociones individuales" },
    { title: "Me interesa", answer: "Inserta aquí la respuesta para leads interesados que desean avanzar" },
    { title: "¿Cómo se hace la compra?", answer: "Explica brevemente el proceso de compra paso a paso" },
    { title: "Garantía de compra", answer: "Indica condiciones de garantía, cobertura y duración" },
    { title: "Medios de pago", answer: "Describe los métodos de pago aceptados: transferencias, contra entrega, etc." },
    { title: "Tiempo de entrega", answer: "Indica tiempos de envío o entrega por zona o producto" },
    { title: "Dirección, ubicación o tienda", answer: "Indica ubicación física o si es 100% online" },
    { title: "Crédito y/o contra entrega", answer: "Informa si está disponible y bajo qué condiciones" },
    { title: "Requisitos (para crédito o contra entrega)", answer: "Enumera los requisitos mínimos que debe cumplir el cliente para aplicar" },
];

export interface FaqSimpleProps {
    values: { faq: string };
    handleChange: (key: "faq") => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export type FqaBuilderProps = FaqSimpleProps & {
    promptId: string;
    version: number;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    initialItems?: QaItem[]; // ← sections.faq.items desde BD
    flows: Workflow[];
    notificationNumber: string;
};


export type ProductItem = { id: string; name: string; description: string };

export type ProductItemDTO = { id: string; name?: string; description?: string };

export interface ProductBuilderProps {
    values: { products: string };
    handleChange: (
        key: "products"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onChange?: (state: { items: ProductItem[]; prompt: string }) => void;

    // NUEVO (persistencia)
    promptId: string;
    version: number;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    initialItems?: ProductItemDTO[]; // sections.products.items desde BD
    flows: Workflow[];
    notificationNumber: string;
}

export type ExtraItem = { id: string; title: string; content: string };


export type ExtraItemDTO = { id: string; title?: string; content?: string };

export interface ExtraInfoBuilderProps {
    notificationNumber: string;
    values: { more: string };
    handleChange: (
        key: "more"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onChange?: (state: {
        items: ExtraItem[];
        firmaEnabled: boolean;
        firmaText: string;
        firmaName: string;
        prompt: string;
    }) => void;

    // NUEVO (persistencia)
    promptId: string;
    version: number;
    onVersionChange: (v: number) => void;
    onConflict?: (serverState: any) => void;
    flows: Workflow[];
    initialExtras?: { items?: ExtraItemDTO[]; firmaEnabled?: boolean; firmaText?: string };
}

export interface FunctionSelectorInterface {
    step: StepTraining
    setSteps: React.Dispatch<React.SetStateAction<StepTraining[]>>
    notificationNumber: string
}

// Tipos de las colecciones

export type Mode = "faq" | "products" | "extras";

// Props genéricas: el padre controla almacenamiento en BD
export type FnSelector<T> = {
    mode: Mode;
    items: T[];
    addItem: (item: T) => void;
    /** Solo para casos donde quieras actualizar descripción/answer (p.ej. FAQ.a) */
    flows?: Workflow[];
    notificationNumber?: string;
};
