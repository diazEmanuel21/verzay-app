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
    /* TrainingBuilder */
    training: "",
    faq: "",
};

export interface BusinessBuilderInterface {
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

export type Flow = { id: string; name: string };

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
    flows?: Flow[];
    notificationNumber?: string | null;
    defaultMainMessage?: string;
    // ✅ Propiedad opcional que es una función
    onChange?: (state: {
        mainMessage: string;
        elements: ElementItem[];
    }) => void;
}
