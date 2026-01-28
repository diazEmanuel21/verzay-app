'use server';

import { db } from '@/lib/db';

type Op<T = unknown> = { success: boolean; message: string; data?: T };

export async function getFinanceAccounts(userId: string): Promise<Op<any[]>> {
  try {
    const accounts = await db.financeAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: { currency: true },
    });
    return { success: true, message: 'OK', data: accounts };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Error listando cuentas' };
  }
}

export async function createFinanceAccount(data: {
  userId: string;
  name: string;
  type?: 'COMPANY' | 'PERSONAL';
  currencyCode: string; // recomendado obligatorio
  isDefault?: boolean;
}): Promise<Op<{ id: string }>> {
  try {
    // si será default, desmarca las demás
    if (data.isDefault) {
      await db.financeAccount.updateMany({
        where: { userId: data.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await db.financeAccount.create({
      data: {
        userId: data.userId,
        name: data.name.trim(),
        type: (data.type ?? 'PERSONAL') as any,
        currencyCode: data.currencyCode,
        isDefault: !!data.isDefault,
      },
      select: { id: true },
    });

    return { success: true, message: 'Cuenta creada', data: { id: created.id } };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Error creando cuenta' };
  }
}

export async function updateFinanceAccount(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    type: 'COMPANY' | 'PERSONAL';
    currencyCode: string;
    isDefault: boolean;
  }>
): Promise<Op> {
  try {
    if (data.isDefault) {
      await db.financeAccount.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    await db.financeAccount.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type as any } : {}),
        ...(data.currencyCode !== undefined ? { currencyCode: data.currencyCode } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      },
    });

    return { success: true, message: 'Cuenta actualizada' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Error actualizando cuenta' };
  }
}

export async function deleteFinanceAccount(id: string, userId: string): Promise<Op> {
  try {
    // bloquea si hay transacciones
    const txCount = await db.financeTransaction.count({
      where: { userId, accountId: id, status: { not: 'DELETED' as any } },
    });
    if (txCount > 0) {
      return { success: false, message: 'No puedes eliminar una cuenta con transacciones.' };
    }

    const deleted = await db.financeAccount.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) return { success: false, message: 'Cuenta no encontrada' };

    return { success: true, message: 'Cuenta eliminada' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Error eliminando cuenta' };
  }
}
