'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

function toISODate(d: any) {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function buildSalesColumns(params: {
  onEdit: (row: any) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
}): ColumnDef<any>[] {
  const { onEdit, onDelete, busy } = params;

  return [
    {
      accessorKey: 'title',
      header: 'Concepto',
      cell: ({ row }) => {
        const v = row.original?.title ?? '—';
        return <div className="min-w-0 truncate text-sm font-medium">{v}</div>;
      },
    },
    {
      accessorKey: 'occurredAt',
      header: 'Fecha',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{toISODate(row.original?.occurredAt)}</span>,
    },
    {
      id: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const r = row.original;
        const symbol = r.currency?.symbol ? `${r.currency.symbol} ` : '';
        return (
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight">{symbol}{String(r.amount ?? '0')}</p>
            <p className="text-xs text-muted-foreground">{r.currencyCode}</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(r)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(r.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
