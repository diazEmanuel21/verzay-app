'use server';

import { db } from '@/lib/db';
import type {
  ExternalDataToolConfig,
  ExternalDataToolConfigInput,
} from '@/types/external-client-data';

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listToolConfigs(userId: string): Promise<ExternalDataToolConfig[]> {
  if (!userId) return [];

  const rows = await db.externalDataToolConfig.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return rows as ExternalDataToolConfig[];
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertToolConfig(
  userId: string,
  input: ExternalDataToolConfigInput,
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'userId requerido' };
  if (!input.toolKey?.trim()) return { success: false, error: 'toolKey requerido' };
  if (!input.displayName?.trim()) return { success: false, error: 'displayName requerido' };
  if (!input.toolDescription?.trim()) return { success: false, error: 'toolDescription requerido' };

  // toolKey: only alphanumeric + underscores, no spaces
  const safeKey = input.toolKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

  try {
    await db.externalDataToolConfig.upsert({
      where: { userId_toolKey: { userId, toolKey: safeKey } },
      create: {
        userId,
        toolKey: safeKey,
        displayName: input.displayName.trim(),
        toolDescription: input.toolDescription.trim(),
        toolType: input.toolType,
        searchField: input.searchField?.trim() || null,
        promptTemplate: input.promptTemplate?.trim() || null,
        isEnabled: input.isEnabled ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
      update: {
        displayName: input.displayName.trim(),
        toolDescription: input.toolDescription.trim(),
        toolType: input.toolType,
        searchField: input.searchField?.trim() || null,
        promptTemplate: input.promptTemplate?.trim() || null,
        isEnabled: input.isEnabled ?? true,
        sortOrder: input.sortOrder ?? 0,
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
