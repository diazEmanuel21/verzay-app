// src/components/prompt-fragments.ts
export type PromptFragment = {
    id: string;
    label: string;
    value: string; // contenido a insertar
};

// ⚠️ Temporal: los values están como encabezados.
//    Puedes reemplazar cada `value` por el bloque de prompt real.
export const PROMPT_FRAGMENTS: PromptFragment[] = [
    {
        id: "notif-asesor",
        label: "## EJECUCIÓN DE TOOL: NOTIFICACIÓN ASESOR",
        value: "## EJECUCIÓN DE TOOL: NOTIFICACIÓN ASESOR\n",
    },
    {
        id: "toma-solicitudes",
        label: "## TOMA Y GESTIÓN DE SOLICITUDES - (GOOGLE SHEETS/MEMORIA)",
        value: "## TOMA Y GESTIÓN DE SOLICITUDES - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "toma-quejas",
        label: "## TOMA Y GESTIÓN DE QUEJAS, REPORTES O RECLAMOS - (GOOGLE SHEETS/MEMORIA)",
        value: "## TOMA Y GESTIÓN DE QUEJAS, REPORTES O RECLAMOS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "toma-pedidos",
        label: "## TOMA Y GESTIÓN DE PEDIDOS - (GOOGLE SHEETS/MEMORIA)",
        value: "## TOMA Y GESTIÓN DE PEDIDOS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "toma-reservas",
        label: "## TOMA Y GESTIÓN DE RESERVAS - (GOOGLE SHEETS/MEMORIA)",
        value: "## TOMA Y GESTIÓN DE RESERVAS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "toma-pagos",
        label: "## TOMA Y GESTIÓN DE PAGOS - (GOOGLE SHEETS/MEMORIA)",
        value: "## TOMA Y GESTIÓN DE PAGOS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    { id: "consulta-clientes", label: "## CONSULTA REGISTRO DE CLIENTES", value: "## CONSULTA REGISTRO DE CLIENTES\n" },
    { id: "consulta-solicitudes", label: "## CONSULTA REGISTRO DE SOLICITUDES", value: "## CONSULTA REGISTRO DE SOLICITUDES\n" },
    { id: "consulta-quejas", label: "## CONSULTA REGISTRO DE QUEJAS, REPORTES O RECLAMOS", value: "## CONSULTA REGISTRO DE QUEJAS, REPORTES O RECLAMOS\n" },
    { id: "consulta-pedidos", label: "## CONSULTA REGISTRO DE PEDIDOS", value: "## CONSULTA REGISTRO DE PEDIDOS\n" },
    { id: "consulta-pagos", label: "## CONSULTA REGISTRO DE PAGOS", value: "## CONSULTA REGISTRO DE PAGOS\n" },
    { id: "consulta-inventario", label: "## CONSULTA REGISTRO DE INVENTARIO", value: "## CONSULTA REGISTRO DE INVENTARIO\n" },
    { id: "consulta-productos", label: "## CONSULTA REGISTRO DE PRODUCTOS", value: "## CONSULTA REGISTRO DE PRODUCTOS\n" },
    {
        id: "upd-solicitudes",
        label: "## ACTUALIZACION DE GESTIÓN DE SOLICITUDES - (GOOGLE SHEETS/MEMORIA)",
        value: "## ACTUALIZACION DE GESTIÓN DE SOLICITUDES - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "upd-quejas",
        label: "## ACTUALIZACION DE GESTIÓN DE QUEJAS, REPORTES O RECLAMOS - (GOOGLE SHEETS/MEMORIA)",
        value: "## ACTUALIZACION DE GESTIÓN DE QUEJAS, REPORTES O RECLAMOS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "upd-reservas",
        label: "## ACTUALIZACION DE GESTIÓN DE RESERVAS - (GOOGLE SHEETS/MEMORIA)",
        value: "## ACTUALIZACION DE GESTIÓN DE RESERVAS - (GOOGLE SHEETS/MEMORIA)\n",
    },
    {
        id: "upd-pedidos",
        label: "## ACTUALIZACION DE GESTIÓN DE PEDIDOS - (GOOGLE SHEETS/MEMORIA)",
        value: "## ACTUALIZACION DE GESTIÓN DE PEDIDOS - (GOOGLE SHEETS/MEMORIA)\n",
    },
];
