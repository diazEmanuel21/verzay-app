import { z } from "zod";

import { ESTADOS_POR_TIPO } from "@/types/registro";

export const CRM_AGENT_PROMPT_IDS = {
  leadStatus: "crm-lead-status-classifier",
  leadFunnel: "crm-lead-funnel-synthesizer",
} as const;

export type CrmPromptKind = keyof typeof CRM_AGENT_PROMPT_IDS;

export const CRM_PROMPT_LEAD_STATUS_ORDER = [
  "FRIO",
  "TIBIO",
  "CALIENTE",
  "FINALIZADO",
  "DESCARTADO",
] as const;

export const CRM_PROMPT_RECORD_TYPES = [
  "SOLICITUD",
  "PEDIDO",
  "RECLAMO",
  "RESERVA",
  "PAGO",
] as const;

export const CRM_LEAD_NAME_JSON_PLACEHOLDER = "{{leadNameJson}}";

const leadStatusDefinitionsShape = {
  FRIO: z.string().trim(),
  TIBIO: z.string().trim(),
  CALIENTE: z.string().trim(),
  FINALIZADO: z.string().trim(),
  DESCARTADO: z.string().trim(),
} satisfies Record<(typeof CRM_PROMPT_LEAD_STATUS_ORDER)[number], z.ZodString>;

const leadFunnelTypeInstructionsShape = {
  SOLICITUD: z.string().trim(),
  PEDIDO: z.string().trim(),
  RECLAMO: z.string().trim(),
  RESERVA: z.string().trim(),
  PAGO: z.string().trim(),
} satisfies Record<(typeof CRM_PROMPT_RECORD_TYPES)[number], z.ZodString>;

export const CrmLeadStatusPromptConfigSchema = z.object({
  role: z.string().trim(),
  responseFormatRule: z.string().trim(),
  useOnlySummary: z.boolean().default(true),
  definitions: z.object(leadStatusDefinitionsShape),
  discardedRule: z.string().trim(),
  finalizedRule: z.string().trim(),
  hotRule: z.string().trim(),
  warmRule: z.string().trim(),
  coldRule: z.string().trim(),
  reasonRule: z.string().trim(),
  extraInstructions: z.string().default(""),
});

export const CrmLeadFunnelPromptConfigSchema = z.object({
  role: z.string().trim(),
  reportTask: z.string().trim(),
  recordTask: z.string().trim(),
  mandatoryRules: z.string().default(""),
  priorityOrder: z.string().trim(),
  typeInstructions: z.object(leadFunnelTypeInstructionsShape),
  paymentStateRule: z.string().trim(),
  reportOutputInstruction: z.string().trim(),
  recordSummaryInstruction: z.string().trim(),
  recordDetailsInstruction: z.string().trim(),
  importantRules: z.string().default(""),
  extraInstructions: z.string().default(""),
});

export type CrmLeadStatusPromptConfig = z.infer<
  typeof CrmLeadStatusPromptConfigSchema
>;
export type CrmLeadFunnelPromptConfig = z.infer<
  typeof CrmLeadFunnelPromptConfigSchema
>;

export type CrmPromptRecordMap = {
  leadStatus: CrmPromptRecord<CrmLeadStatusPromptConfig>;
  leadFunnel: CrmPromptRecord<CrmLeadFunnelPromptConfig>;
};

export type CrmPromptRecord<TConfig> = {
  id: string;
  kind: CrmPromptKind;
  agentId: string;
  version: number;
  promptText: string;
  config: TConfig;
  updatedAt: string | null;
};

export const CRM_LEAD_STATUS_PROMPT_DEFAULTS: CrmLeadStatusPromptConfig = {
  role: "Eres un clasificador de estado comercial del lead.",
  responseFormatRule:
    "Debes responder SOLO con JSON valido, sin markdown, sin texto adicional.",
  useOnlySummary: true,
  definitions: {
    FRIO: "interes bajo o exploratorio, sin urgencia ni siguiente paso claro.",
    TIBIO:
      "interes real, pero aun faltan dudas, comparacion, presupuesto o decision.",
    CALIENTE:
      "intencion clara de compra o avance cercano. Hay senales de cierre, pago o agendamiento.",
    FINALIZADO: "ya se cerro el objetivo comercial o el proceso ya termino.",
    DESCARTADO:
      "no hay interes, se cayo la oportunidad o no conviene insistir.",
  },
  discardedRule:
    "Si la sintesis muestra rechazo claro o ausencia de interes, usa DESCARTADO.",
  finalizedRule:
    "Si la sintesis indica compra cerrada, implementacion terminada o proceso completado, usa FINALIZADO.",
  hotRule:
    "Si la sintesis muestra intencion clara de avanzar pronto, usa CALIENTE.",
  warmRule:
    "Si la sintesis muestra interes pero todavia con dudas o sin definicion, usa TIBIO.",
  coldRule: "Si la sintesis es debil, exploratoria o temprana, usa FRIO.",
  reasonRule:
    'El campo "reason" debe ser una frase corta, concreta y util para auditoria.',
  extraInstructions: "",
};

export const CRM_LEAD_FUNNEL_PROMPT_DEFAULTS: CrmLeadFunnelPromptConfig = {
  role: "Eres un CLASIFICADOR para un embudo de clientes en WhatsApp.",
  reportTask:
    'Si es solo conversacion/charla y NO representa un evento que deba registrarse => kind="REPORTE" y devuelves una sintesis corta.',
  recordTask:
    'Si es un evento que debe guardarse como registro => kind="REGISTRO" y devuelves tipo/estado/resumen/detalles/meta.',
  mandatoryRules: [
    "Debes responder SOLO con JSON valido, sin markdown, sin texto adicional.",
    'Si kind="REGISTRO": "tipo" solo puede ser uno de: SOLICITUD, PEDIDO, RECLAMO, RESERVA, PAGO.',
    'Si kind="REGISTRO": "estado" debe ser uno de los estados validos para ese tipo (ver lista abajo).',
    "Si hay intencion de compra, cotizacion, informacion, soporte, agendar, pagar, reclamo => normalmente es REGISTRO.",
    "Si es saludo, charla, mensajes sueltos sin intencion clara o sin requerir accion => REPORTE.",
  ].join("\n"),
  priorityOrder: "PAGO > RECLAMO > RESERVA > PEDIDO > SOLICITUD",
  typeInstructions: {
    PAGO:
      "el cliente envia comprobante/soporte de pago, confirma que pago, pregunta si se recibio el pago, envia referencia/transferencia/deposito o captura de pantalla de pago.",
    RECLAMO:
      'queja, inconformidad, dano, no llego, llego mal, pide devolucion, garantia, "me estafaron", "no me responden".',
    RESERVA:
      "agenda/cita/reservar/confirmar fecha y hora, apartar cupo, apartar producto/servicio para una fecha.",
    PEDIDO:
      'confirma compra, solicita cantidad/talla/modelo, direccion/envio, "lo quiero", "quiero pedir", "hazme el pedido", "orden", "compra".',
    SOLICITUD:
      "pide informacion/precio/cotizacion/catalogo, disponibilidad, horarios, ubicacion, metodos de pago (pero SIN comprobante), preguntas para decidir.",
  },
  paymentStateRule:
    'Estado al crear SIEMPRE debe ser "Pendiente" (aunque el cliente diga que ya pago).',
  reportOutputInstruction:
    "Sintesis actualizada de la conversacion (2-4 lineas). Si ya hay contexto, integra el nuevo mensaje sin repetir.",
  recordSummaryInstruction: "1 linea (que paso)",
  recordDetailsInstruction: "2-5 lineas (que quiere / que problema / que pidio)",
  importantRules: [
    'NUNCA uses tipo="REPORTE" cuando kind="REGISTRO".',
    'Si es conversacion general o resumen del chat => kind="REPORTE".',
    "Solo puedes usar estos tipos (si kind=\"REGISTRO\"): SOLICITUD, PEDIDO, RECLAMO, RESERVA, PAGO.",
  ].join("\n"),
  extraInstructions: "",
};

function normalizeMultilineText(value: string | null | undefined) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function parseBulletLines(value: string | null | undefined) {
  return normalizeMultilineText(value)
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
}

function appendBullets(target: string[], value: string | null | undefined) {
  for (const line of parseBulletLines(value)) {
    target.push(`- ${line}`);
  }
}

export function normalizeCrmLeadStatusPromptConfig(
  value?: unknown
): CrmLeadStatusPromptConfig {
  return CrmLeadStatusPromptConfigSchema.parse({
    ...CRM_LEAD_STATUS_PROMPT_DEFAULTS,
    ...(value as Record<string, unknown> | undefined),
    definitions: {
      ...CRM_LEAD_STATUS_PROMPT_DEFAULTS.definitions,
      ...((value as { definitions?: Record<string, unknown> } | undefined)
        ?.definitions ?? {}),
    },
  });
}

export function normalizeCrmLeadFunnelPromptConfig(
  value?: unknown
): CrmLeadFunnelPromptConfig {
  return CrmLeadFunnelPromptConfigSchema.parse({
    ...CRM_LEAD_FUNNEL_PROMPT_DEFAULTS,
    ...(value as Record<string, unknown> | undefined),
    typeInstructions: {
      ...CRM_LEAD_FUNNEL_PROMPT_DEFAULTS.typeInstructions,
      ...((value as { typeInstructions?: Record<string, unknown> } | undefined)
        ?.typeInstructions ?? {}),
    },
  });
}

export function buildLeadStatusPromptFromConfig(
  input?: unknown
): string {
  const config = normalizeCrmLeadStatusPromptConfig(input);
  const lines: string[] = [config.role, "", config.responseFormatRule, ""];

  lines.push("Estados validos:");
  for (const status of CRM_PROMPT_LEAD_STATUS_ORDER) {
    lines.push(`- ${status}`);
  }

  lines.push("", "Definiciones:");
  for (const status of CRM_PROMPT_LEAD_STATUS_ORDER) {
    lines.push(`- ${status}: ${config.definitions[status]}`);
  }

  lines.push("", "Reglas:");
  if (config.useOnlySummary) {
    lines.push("- Usa solo la sintesis entregada. No inventes contexto.");
  }
  lines.push(`- ${config.discardedRule}`);
  lines.push(`- ${config.finalizedRule}`);
  lines.push(`- ${config.hotRule}`);
  lines.push(`- ${config.warmRule}`);
  lines.push(`- ${config.coldRule}`);
  lines.push(
    `- El campo "leadStatus" solo puede ser uno de: ${CRM_PROMPT_LEAD_STATUS_ORDER.join(
      ", "
    )}.`
  );
  lines.push(`- ${config.reasonRule}`);
  appendBullets(lines, config.extraInstructions);

  lines.push(
    "",
    "Respuesta esperada:",
    "{",
    `  "leadStatus": "${CRM_PROMPT_LEAD_STATUS_ORDER.join("|")}",`,
    '  "reason": "frase corta"',
    "}"
  );

  return lines.join("\n");
}

export function buildLeadFunnelPromptFromConfig(
  input?: unknown
): string {
  const config = normalizeCrmLeadFunnelPromptConfig(input);
  const lines: string[] = [config.role, ""];

  lines.push("Tu tarea: analizar el MENSAJE y decidir UNA sola cosa:");
  lines.push(`1) ${config.reportTask}`);
  lines.push(`2) ${config.recordTask}`);

  lines.push("", "REGLAS OBLIGATORIAS:");
  appendBullets(lines, config.mandatoryRules);

  lines.push("", 'CLASIFICACION POR TIPO (solo si kind="REGISTRO"):');
  lines.push(`PRIORIDAD (si hay conflicto): ${config.priorityOrder}`);
  lines.push("");
  lines.push(`- PAGO: ${config.typeInstructions.PAGO}`);
  lines.push(`  - ${config.paymentStateRule}`);
  lines.push(`- RECLAMO: ${config.typeInstructions.RECLAMO}`);
  lines.push(`- RESERVA: ${config.typeInstructions.RESERVA}`);
  lines.push(`- PEDIDO: ${config.typeInstructions.PEDIDO}`);
  lines.push(`- SOLICITUD: ${config.typeInstructions.SOLICITUD}`);

  lines.push("", "ESTADOS VALIDOS POR TIPO:");
  lines.push(JSON.stringify(ESTADOS_POR_TIPO, null, 2));

  lines.push("", "FORMATO DE RESPUESTA:", "", "Caso REPORTE:");
  lines.push("{");
  lines.push('  "kind": "REPORTE",');
  lines.push(`  "sintesis": "${config.reportOutputInstruction}"`);
  lines.push("}");

  lines.push("", "Caso REGISTRO:");
  lines.push("{");
  lines.push('  "kind": "REGISTRO",');
  lines.push(`  "tipo": "${CRM_PROMPT_RECORD_TYPES.join("|")}",`);
  lines.push('  "estado": "UNO_DE_LOS_ESTADOS_VALIDOS",');
  lines.push(`  "resumen": "${config.recordSummaryInstruction}",`);
  lines.push(`  "detalles": "${config.recordDetailsInstruction}",`);
  lines.push('  "lead": true,');
  lines.push(`  "nombre": ${CRM_LEAD_NAME_JSON_PLACEHOLDER},`);
  lines.push('  "meta": { "cualquier_dato_util": "..." }');
  lines.push("}");

  lines.push("", "IMPORTANTE:");
  appendBullets(lines, config.importantRules);
  appendBullets(lines, config.extraInstructions);

  return lines.join("\n");
}

export function createCrmPromptRecord(
  kind: "leadStatus",
  value?: Partial<CrmPromptRecord<unknown>> & {
    config?: unknown;
    promptText?: string | null;
  }
): CrmPromptRecord<CrmLeadStatusPromptConfig>;
export function createCrmPromptRecord(
  kind: "leadFunnel",
  value?: Partial<CrmPromptRecord<unknown>> & {
    config?: unknown;
    promptText?: string | null;
  }
): CrmPromptRecord<CrmLeadFunnelPromptConfig>;
export function createCrmPromptRecord(
  kind: CrmPromptKind,
  value?: {
    id?: string;
    version?: number;
    updatedAt?: string | null;
    config?: unknown;
    promptText?: string | null;
  }
):
  | CrmPromptRecord<CrmLeadStatusPromptConfig>
  | CrmPromptRecord<CrmLeadFunnelPromptConfig> {
  if (kind === "leadStatus") {
    const config = normalizeCrmLeadStatusPromptConfig(value?.config);
    return {
      id: String(value?.id ?? ""),
      kind,
      agentId: CRM_AGENT_PROMPT_IDS[kind],
      version: Number(value?.version ?? 1),
      promptText:
        String(value?.promptText ?? "").trim() ||
        buildLeadStatusPromptFromConfig(config),
      config,
      updatedAt: value?.updatedAt ?? null,
    } satisfies CrmPromptRecord<CrmLeadStatusPromptConfig>;
  }

  const config = normalizeCrmLeadFunnelPromptConfig(value?.config);
  return {
    id: String(value?.id ?? ""),
    kind,
    agentId: CRM_AGENT_PROMPT_IDS[kind],
    version: Number(value?.version ?? 1),
    promptText:
      String(value?.promptText ?? "").trim() ||
      buildLeadFunnelPromptFromConfig(config),
    config,
    updatedAt: value?.updatedAt ?? null,
  } satisfies CrmPromptRecord<CrmLeadFunnelPromptConfig>;
}
