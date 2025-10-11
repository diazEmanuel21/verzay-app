import { UserWithApiKeys } from "@/schema/schema";
import { Workflow } from "@prisma/client";
import { ChangeEvent } from "react";
import z from "zod";

/* ---------------------- Validación ligera con Zod ---------------------- */
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

export interface MainAiInterface {
    flows: Workflow[];
    user: UserWithApiKeys;
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
    faq?: string
    products?: string
    more?: string
};

export const initialValues: BusinessValues = {
    /* BusinessPromptBuilder */
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
};

export interface PromptPreviewInterface {
    prompt: string
};

/******** TrainingBuilder **********/

// types.ts (o arriba del componente)
export interface TrainingBuilderExternalProps {
    // Solo necesitamos la propiedad training del objeto principal
    values: { training: string };
    handleChange: (
        key: "training"
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

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
        prompt: string; // snippet fijo
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

export const CONSULTA_DATOS_SNIPPET = `**Consultar Productos**: (Prioridad 2). Si no hay un flujo activo y el usuario pregunta por un producto, ejecuta esta herramienta.
- *Disparadores:* “imagen”, “foto”, “video”, “pdf”, “documento”, “ver”, “ver el producto”, “muéstrame”, “catálogo”.`;

export interface TrainingBuilderProps extends TrainingBuilderExternalProps {
    flows: Workflow[];
    notificationNumber?: string | null;
    defaultMainMessage?: string;
    // ✅ Propiedad opcional que es una función
    onChange?: (state: {
        mainMessage: string;
        elements: ElementItem[];
    }) => void;
}


/*****************  FQABUILDER ***********************/

/* ---------- Modelo interno ---------- */
export type QaItem = {
    id: string;
    q: string; // pregunta
    a: string; // respuesta
};

/* ---------- Plantillas predefinidas ---------- */
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
    handleChange: (
        key: "faq"
    ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}