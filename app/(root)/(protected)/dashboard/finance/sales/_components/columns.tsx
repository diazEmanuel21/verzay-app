'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  MoreHorizontal,
  CalendarDays,
  Layers,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react';

function formatDate(isoOrDate: any) {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toNumber(v: any) {
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

export function buildSalesColumns(params: {
  onEdit: (row: any) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
}): ColumnDef<any>[] {
  const { onEdit, onDelete, busy } = params;

  return [
    {
      accessorKey: 'occurredAt',
      header: () => (
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Fecha
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.occurredAt)}</span>
      ),
      size: 120,
    },

    {
      accessorKey: 'title',
      header: 'Concepto',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {row.original.title || 'Sin concepto'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.category?.name || 'Sin categoría'}
          </p>
        </div>
      ),
    },

    // ✅ CUENTA (usa row.original.account.name)
    {
      id: 'account',
      header: () => (
        <span className="inline-flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          Cuenta
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.account?.name || '—'}
        </span>
      ),
      size: 160,
    },

    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const symbol = row.original.currency?.symbol ? `${row.original.currency.symbol} ` : '';
        const code = row.original.currencyCode || '';
        const amount = toNumber(row.original.amount);
        const pretty = new Intl.NumberFormat('es-CO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);

        return (
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight">
              {symbol}{pretty}
            </p>
            <p className="text-xs text-muted-foreground">{code}</p>
          </div>
        );
      },
      size: 140,
    },

    // ✅ ARCHIVOS (usa row.original.attachments.length)
    {
      id: 'attachments',
      header: () => (
        <span className="inline-flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Archivos
        </span>
      ),
      cell: ({ row }) => {
        const count = row.original.attachments?.length ?? 0;
        return (
          <span className="inline-flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            {count ? `${count}` : '—'}
          </span>
        );
      },
      size: 110,
    },

    // Acciones
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const original = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={busy}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onDelete(original.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 60,
    },
  ];
}
