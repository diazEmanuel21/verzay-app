"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Employee } from "@prisma/client";
import { deleteEmployee } from "@/actions/employees-actions";

export const columns = (
  setEditing: (emp: Employee | null) => void,
  setOpen: (v: boolean) => void
): ColumnDef<Employee>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "role",
    header: "Cargo",
  },
  {
    accessorKey: "email",
    header: "Correo",
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
  },
  {
    accessorKey: "isActive",
    header: "Estado",
    cell: ({ row }) =>
      row.original.isActive ? (
        <span className="text-green-600 font-medium">Activo</span>
      ) : (
        <span className="text-red-500 font-medium">Inactivo</span>
      ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const emp = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(emp);
              setOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              const res = await deleteEmployee(emp.id);
              if (res.success) toast.success("Empleado eliminado");
              else toast.error(res.message);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];