'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { DataTable } from '../../sales/_components/data-table'; // usa tu DataTable existente (ajusta ruta si cambia)
import { buildAccountsColumns } from './columns';

import {
  createFinanceAccount,
  deleteFinanceAccount,
  updateFinanceAccount,
} from '@/actions/finance-accounts-actions';

import { Plus, Wallet, Coins } from 'lucide-react';

type Props = {
  userId: string;
  initialAccounts: any[];
  currencies: any[];
};

type FormState = {
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  currencyCode: string;
  isDefault: boolean;
};

export default function MainFinanceAccounts({ userId, initialAccounts, currencies }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<any[]>(initialAccounts ?? []);
  useEffect(() => setRows(initialAccounts ?? []), [initialAccounts]);

  const defaultCurrencyCode = useMemo(() => {
    return currencies?.find((c) => c.code === 'USD')?.code || currencies?.[0]?.code || 'USD';
  }, [currencies]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'PERSONAL',
    currencyCode: defaultCurrencyCode,
    isDefault: false,
  });

  useEffect(() => {
    // si cambian currencies y aún no hay moneda seleccionada
    setForm((p) => ({
      ...p,
      currencyCode: p.currencyCode || defaultCurrencyCode,
    }));
  }, [defaultCurrencyCode]);

  const resetForm = () => {
    setForm({
      name: '',
      type: 'PERSONAL',
      currencyCode: defaultCurrencyCode,
      isDefault: false,
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      type: (row.type ?? 'PERSONAL') as any,
      currencyCode: row.currencyCode ?? defaultCurrencyCode,
      isDefault: !!row.isDefault,
    });
    setOpen(true);
  };

  const onSave = () => {
    if (!form.name.trim()) return toast.error('Ingresa un nombre de cuenta');
    if (!form.currencyCode) return toast.error('Selecciona una moneda');

    startTransition(() => {
      void (async () => {
        const payload = {
          userId,
          name: form.name.trim(),
          type: form.type,
          currencyCode: form.currencyCode,
          isDefault: form.isDefault,
        };

        const res = editing
          ? await updateFinanceAccount(editing.id, userId, payload)
          : await createFinanceAccount(payload);

        if (!res.success) return toast.error(res.message);

        toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
        setOpen(false);
        setEditing(null);

        // refresca server props
        router.refresh();
      })();
    });
  };

  const onDelete = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await deleteFinanceAccount(id, userId);
        if (!res.success) return toast.error(res.message);

        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success('Cuenta eliminada');
        router.refresh();
      })();
    });
  };

  const onSetDefault = (row: any) => {
    startTransition(() => {
      void (async () => {
        const res = await updateFinanceAccount(row.id, userId, { isDefault: true });
        if (!res.success) return toast.error(res.message);

        toast.success('Cuenta por defecto actualizada');
        router.refresh();
      })();
    });
  };

  const columns = useMemo(
    () =>
      buildAccountsColumns({
        onEdit: openEdit,
        onDelete,
        onSetDefault,
        busy: isPending,
      }),
    [isPending] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="space-y-3">
      <Card className="border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Cuentas</CardTitle>
              <Badge variant="secondary" className="h-6 text-[11px]">
                {rows.length} cuentas
              </Badge>
            </div>

            <Button size="sm" onClick={openCreate} disabled={isPending} className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Nueva cuenta
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <DataTable
            columns={columns as any}
            data={rows}
            searchKey="name"
            searchPlaceholder="Buscar cuenta..."
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[680px] rounded-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              {editing ? 'Editar cuenta' : 'Nueva cuenta'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Define el nombre, tipo y moneda base de la cuenta.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Nombre */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Nombre</p>
                </div>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Ej: Caja principal"
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Tipo</p>
                </div>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as any }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL" className="text-sm">
                      Personal
                    </SelectItem>
                    <SelectItem value="COMPANY" className="text-sm">
                      Empresa
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Moneda de la cuenta</p>
                </div>

                <Select
                  value={form.currencyCode}
                  onValueChange={(v) => setForm((p) => ({ ...p, currencyCode: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-sm">
                        {c.code} {c.symbol ? `· ${c.symbol}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  Recomendado: la moneda se usa por defecto al crear ventas/gastos con esta cuenta.
                </p>
              </div>

              <Separator className="sm:col-span-2" />

              {/* Default */}
              <div className="flex items-center justify-between rounded-xl border bg-muted/10 px-3 py-2 sm:col-span-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Cuenta por defecto</p>
                  <p className="text-xs text-muted-foreground">
                    Se selecciona automáticamente al crear una venta o gasto.
                  </p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isDefault: v }))}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                size="sm"
                disabled={isPending}
                className="h-9"
              >
                {editing ? 'Guardar cambios' : 'Crear cuenta'}
              </Button>
            </div>

            {/* Accion rápida: set default desde modal cuando editas */}
            {editing && !editing.isDefault ? (
              <>
                <Separator />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => onSetDefault(editing)}
                >
                  Marcar como cuenta por defecto
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
