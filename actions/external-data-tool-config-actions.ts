'use server';

import { db } from '@/lib/db';
import type {
  ExternalDataBuiltinToolType,
  ExternalDataToolConfig,
  ExternalDataToolConfigInput,
} from '@/types/external-client-data';

// ─── Catálogo builtin (fuente de verdad compartida con el backend) ─────────────

/**
 * Define el catálogo completo de herramientas del sistema.
 * Cada entrada tiene implementación real en NestJS (dispatcher en ai-agent.service.ts).
 * NO agregar entradas aquí sin antes implementar el toolType en el backend.
 */
export const BUILTIN_TOOL_CATALOG: {
  toolType: ExternalDataBuiltinToolType;
  defaultKey: string;
  defaultDisplayName: string;
  defaultDescription: string;
  isCritical: boolean;
  helpText: string;
  sortOrder: number;
}[] = [
  {
    toolType: 'notificacion_asesor',
    defaultKey: 'Notificacion_Asesor',
    defaultDisplayName: 'Notificación al asesor',
    defaultDescription:
      'Utiliza esta herramienta cuando un usuario necesite la ayuda directa de un asesor humano (reclamos, solicitudes complejas, dudas de pago o agendamiento).',
    isCritical: true,
    helpText:
      'Envía una notificación interna al equipo de soporte cuando el cliente lo necesita. Recomendado tener siempre habilitada.',
    sortOrder: 0,
  },
  {
    toolType: 'ejecutar_flujos',
    defaultKey: 'Ejecutar_Flujos',
    defaultDisplayName: 'Ejecutar flujos automatizados',
    defaultDescription:
      'Siempre consulta y ejecuta si existen flujos disponibles en la base de datos que correspondan a la solicitud del usuario. Si se encuentra un flujo, se ejecuta. Si no hay flujos, la IA continúa la conversación normalmente.',
    isCritical: true,
    helpText:
      'Permite al agente disparar flujos automatizados configurados en el sistema. Es crítica para el funcionamiento de la automatización.',
    sortOrder: 1,
  },
  {
    toolType: 'listar_workflows',
    defaultKey: 'listar_workflows',
    defaultDisplayName: 'Listar flujos disponibles',
    defaultDescription: 'Devuelve todos los flujos disponibles para este usuario.',
    isCritical: false,
    helpText:
      'Permite al agente conocer qué flujos automáticos están disponibles antes de ejecutarlos.',
    sortOrder: 2,
  },
  {
    toolType: 'consultar_datos_cliente',
    defaultKey: 'consultar_datos_cliente',
    defaultDisplayName: 'Consultar datos del cliente',
    defaultDescription:
      'Consulta el perfil externo del cliente actual: cédula, correo, servicio contratado, monto, sector, convenio u otros campos configurados. Úsala cuando el cliente pregunte por su información de cuenta, servicio o datos personales registrados.',
    isCritical: false,
    helpText:
      'Busca en datos externos el registro asociado al número de WhatsApp del cliente que está escribiendo. Requiere que el cliente tenga datos cargados.',
    sortOrder: 3,
  },
  {
    toolType: 'buscar_cliente_por_dato',
    defaultKey: 'buscar_cliente_por_dato',
    defaultDisplayName: 'Buscar cliente por dato',
    defaultDescription:
      'Busca la información de un cliente a partir de un dato conocido (cédula, RIF, correo, etc.). Solo consulta datos del usuario actual, nunca información de otros clientes.',
    isCritical: false,
    helpText:
      'Permite al agente buscar por cualquier campo del registro externo. Útil cuando el cliente pregunta por datos de un tercero proporcionando su cédula u otro identificador.',
    sortOrder: 4,
  },
];

// Conjunto de toolTypes válidos para validación en servidor
const VALID_BUILTIN_TOOL_TYPES = new Set(BUILTIN_TOOL_CATALOG.map((c) => c.toolType));
const VALID_DATA_QUERY_TOOL_TYPES = new Set(['auto_inject', 'search_by_field']);

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listToolConfigs(userId: string): Promise<ExternalDataToolConfig[]> {
  if (!userId) return [];

  const rows = await db.externalDataToolConfig.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return rows as ExternalDataToolConfig[];
}

// ─── Add builtin tool from catalog ───────────────────────────────────────────

/**
 * Agrega una herramienta builtin al usuario desde el catálogo del sistema.
 * Validaciones de servidor:
 *  - toolType debe existir en BUILTIN_TOOL_CATALOG
 *  - No puede existir ya un registro con el mismo toolType para ese userId
 *  - El toolKey personalizado no puede colisionar con otro toolKey existente
 *  - displayName y toolDescription requeridos
 */
export async function addBuiltinTool(
  userId: string,
  toolType: ExternalDataBuiltinToolType,
  overrides: { toolKey?: string; displayName?: string; toolDescription?: string },
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'userId requerido' };

  // Validar que el toolType existe en el catálogo
  if (!VALID_BUILTIN_TOOL_TYPES.has(toolType)) {
    return { success: false, error: `toolType "${toolType}" no existe en el catálogo del sistema` };
  }

  const catalogEntry = BUILTIN_TOOL_CATALOG.find((c) => c.toolType === toolType)!;

  const finalKey = (overrides.toolKey?.trim() || catalogEntry.defaultKey).trim();
  const finalDisplayName = (overrides.displayName?.trim() || catalogEntry.defaultDisplayName).trim();
  const finalDescription = (overrides.toolDescription?.trim() || catalogEntry.defaultDescription).trim();

  if (!finalDisplayName) return { success: false, error: 'El nombre visible es requerido' };
  if (!finalDescription) return { success: false, error: 'La descripción para el agente es requerida' };
  if (!finalKey) return { success: false, error: 'El nombre del tool es requerido' };

  try {
    // Verificar que el toolType no esté ya agregado (1 instancia por toolType por usuario)
    const existingByType = await db.externalDataToolConfig.findFirst({
      where: { userId, toolType },
    });
    if (existingByType) {
      return {
        success: false,
        error: `La herramienta "${catalogEntry.defaultDisplayName}" ya está agregada para este cliente`,
      };
    }

    // Verificar que el toolKey no colisione con otra herramienta existente
    const existingByKey = await db.externalDataToolConfig.findFirst({
      where: { userId, toolKey: finalKey },
    });
    if (existingByKey) {
      return {
        success: false,
        error: `El nombre "${finalKey}" ya está en uso por otra herramienta. Elige un nombre diferente.`,
      };
    }

    await db.externalDataToolConfig.create({
      data: {
        userId,
        toolKey: finalKey,
        displayName: finalDisplayName,
        toolDescription: finalDescription,
        toolCategory: 'builtin',
        toolType,
        searchField: null,
        promptTemplate: null,
        isEnabled: true,
        isDefault: false,
        sortOrder: catalogEntry.sortOrder,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Update builtin tool (solo nombre/descripción/toolKey) ───────────────────

/**
 * Actualiza los campos editables de una herramienta builtin.
 * toolCategory y toolType son inmutables.
 */
export async function updateBuiltinTool(
  userId: string,
  currentToolKey: string,
  updates: { toolKey: string; displayName: string; toolDescription: string },
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !currentToolKey) return { success: false, error: 'Parámetros inválidos' };

  const newKey = updates.toolKey.trim();
  const newDisplayName = updates.displayName.trim();
  const newDescription = updates.toolDescription.trim();

  if (!newKey) return { success: false, error: 'El nombre del tool es requerido' };
  if (!newDisplayName) return { success: false, error: 'El nombre visible es requerido' };
  if (!newDescription) return { success: false, error: 'La descripción para el agente es requerida' };

  try {
    // Si cambió el toolKey, verificar que no colisione con otro
    if (newKey !== currentToolKey) {
      const collision = await db.externalDataToolConfig.findFirst({
        where: { userId, toolKey: newKey },
      });
      if (collision) {
        return {
          success: false,
          error: `El nombre "${newKey}" ya está en uso por otra herramienta.`,
        };
      }
    }

    await db.externalDataToolConfig.update({
      where: { userId_toolKey: { userId, toolKey: currentToolKey } },
      data: {
        toolKey: newKey,
        displayName: newDisplayName,
        toolDescription: newDescription,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Upsert data_query tool ───────────────────────────────────────────────────

/**
 * Crea o actualiza una herramienta de tipo data_query (search_by_field / auto_inject).
 * Validaciones de servidor:
 *  - toolCategory debe ser 'data_query'
 *  - toolType debe ser 'search_by_field' o 'auto_inject'
 *  - search_by_field: searchField requerido
 *  - auto_inject: promptTemplate recomendado (se avisa pero no bloquea)
 *  - toolKey único por usuario (en update: solo si cambió)
 */
export async function upsertDataQueryTool(
  userId: string,
  input: ExternalDataToolConfigInput,
  editingKey?: string, // toolKey actual cuando se está editando
): Promise<{ success: boolean; error?: string; warning?: string }> {
  if (!userId) return { success: false, error: 'userId requerido' };

  // Validar categoría
  if (input.toolCategory !== 'data_query') {
    return { success: false, error: 'Solo se pueden gestionar herramientas de tipo data_query desde este formulario' };
  }

  // Validar toolType
  if (!VALID_DATA_QUERY_TOOL_TYPES.has(input.toolType)) {
    return { success: false, error: `toolType "${input.toolType}" no es válido para herramientas dinámicas` };
  }

  // Normalizar toolKey
  const rawKey = input.toolKey?.trim() ?? '';
  if (!rawKey) return { success: false, error: 'El nombre del tool es requerido' };
  const safeKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const displayName = input.displayName?.trim() ?? '';
  if (!displayName) return { success: false, error: 'El nombre visible es requerido' };

  const toolDescription = input.toolDescription?.trim() ?? '';
  if (!toolDescription) return { success: false, error: 'La descripción para el agente es requerida' };

  // search_by_field: searchField obligatorio
  if (input.toolType === 'search_by_field') {
    const sf = input.searchField?.trim() ?? '';
    if (!sf) return { success: false, error: 'El campo de búsqueda es requerido para herramientas de tipo "Búsqueda por campo"' };
  }

  let warning: string | undefined;

  try {
    const isEditing = !!editingKey;
    const keyChanged = isEditing && safeKey !== editingKey;

    // Verificar colisión de toolKey
    if (!isEditing || keyChanged) {
      const collision = await db.externalDataToolConfig.findFirst({
        where: { userId, toolKey: safeKey },
      });
      if (collision) {
        return { success: false, error: `El nombre "${safeKey}" ya está en uso por otra herramienta.` };
      }
    }

    // Advertir si ya existe un auto_inject (no bloqueante)
    if (input.toolType === 'auto_inject' && !isEditing) {
      const existingAutoInject = await db.externalDataToolConfig.findFirst({
        where: { userId, toolType: 'auto_inject' },
      });
      if (existingAutoInject) {
        warning = 'Ya existe una herramienta de inyección automática. Tener más de una puede duplicar datos en el contexto del agente.';
      }
    }

    if (isEditing) {
      await db.externalDataToolConfig.update({
        where: { userId_toolKey: { userId, toolKey: editingKey } },
        data: {
          toolKey: safeKey,
          displayName,
          toolDescription,
          searchField: input.searchField?.trim() || null,
          promptTemplate: input.promptTemplate?.trim() || null,
          isEnabled: input.isEnabled ?? true,
        },
      });
    } else {
      await db.externalDataToolConfig.create({
        data: {
          userId,
          toolKey: safeKey,
          displayName,
          toolDescription,
          toolCategory: 'data_query',
          toolType: input.toolType,
          searchField: input.searchField?.trim() || null,
          promptTemplate: input.promptTemplate?.trim() || null,
          isEnabled: input.isEnabled ?? true,
          isDefault: false,
          sortOrder: input.sortOrder ?? 10,
        },
      });
    }

    return { success: true, warning };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Apply all defaults (seed) ────────────────────────────────────────────────

/**
 * Siembra todo el catálogo builtin para un usuario.
 * Solo crea las que no existen (por toolType). Nunca sobreescribe.
 */
export async function applyDefaultToolConfigs(
  userId: string,
): Promise<{ success: boolean; created: number; skipped: number; error?: string }> {
  if (!userId) return { success: false, created: 0, skipped: 0, error: 'userId requerido' };

  try {
    const existing = await db.externalDataToolConfig.findMany({
      where: { userId, toolCategory: 'builtin' },
      select: { toolType: true },
    });

    const existingTypes = new Set(existing.map((r) => r.toolType));
    let created = 0;
    let skipped = 0;

    for (const entry of BUILTIN_TOOL_CATALOG) {
      if (existingTypes.has(entry.toolType)) {
        skipped++;
        continue;
      }

      // Verificar que el toolKey por defecto no colisione con data_query existentes
      const keyInUse = await db.externalDataToolConfig.findFirst({
        where: { userId, toolKey: entry.defaultKey },
      });

      await db.externalDataToolConfig.create({
        data: {
          userId,
          toolKey: keyInUse ? `${entry.defaultKey}_${Date.now()}` : entry.defaultKey,
          displayName: entry.defaultDisplayName,
          toolDescription: entry.defaultDescription,
          toolCategory: 'builtin',
          toolType: entry.toolType,
          searchField: null,
          promptTemplate: null,
          isEnabled: true,
          isDefault: true,
          sortOrder: entry.sortOrder,
        },
      });

      created++;
    }

    return { success: true, created, skipped };
  } catch (error: any) {
    return { success: false, created: 0, skipped: 0, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Restore single builtin to catalog defaults ───────────────────────────────

export async function restoreToolConfigDefault(
  userId: string,
  toolKey: string,
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !toolKey) return { success: false, error: 'Parámetros inválidos' };

  const record = await db.externalDataToolConfig.findFirst({
    where: { userId, toolKey },
    select: { toolType: true },
  });
  if (!record) return { success: false, error: 'Herramienta no encontrada' };

  const catalogEntry = BUILTIN_TOOL_CATALOG.find((c) => c.toolType === record.toolType);
  if (!catalogEntry) return { success: false, error: 'No existe configuración por defecto para esta herramienta' };

  try {
    await db.externalDataToolConfig.update({
      where: { userId_toolKey: { userId, toolKey } },
      data: {
        displayName: catalogEntry.defaultDisplayName,
        toolDescription: catalogEntry.defaultDescription,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Toggle enabled ───────────────────────────────────────────────────────────

export async function toggleToolConfig(
  userId: string,
  toolKey: string,
  isEnabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !toolKey) return { success: false, error: 'Parámetros inválidos' };

  try {
    await db.externalDataToolConfig.update({
      where: { userId_toolKey: { userId, toolKey } },
      data: { isEnabled },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteToolConfig(
  userId: string,
  toolKey: string,
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !toolKey) return { success: false, error: 'Parámetros inválidos' };

  try {
    await db.externalDataToolConfig.delete({
      where: { userId_toolKey: { userId, toolKey } },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Error desconocido' };
  }
}
