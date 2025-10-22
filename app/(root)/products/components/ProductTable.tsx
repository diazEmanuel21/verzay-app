// components/products/ProductTable.tsx
"use client";

import { useMemo } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "./ProductForm";
import { deleteProduct } from "@/actions/products-actions";

type Product = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    sku: string | null;
    stock: number;
    isActive: boolean;
    images: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

export const ProductTable = ({ data }: { data: { items: Product[]; total: number; page: number; pages: number } }) => {
    const columns = useMemo<ColumnDef<Product>[]>(() => [
        { header: "Título", accessorKey: "title" },
        { header: "SKU", accessorKey: "sku", cell: ({ getValue }) => getValue() || "—" },
        { header: "Precio", accessorKey: "price", cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}` },
        { header: "Stock", accessorKey: "stock" },
        {
            header: "Estado", accessorKey: "isActive", cell: ({ getValue }) => (
                <Badge variant={getValue() ? "default" : "secondary"}>{getValue() ? "Activo" : "Inactivo"}</Badge>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex gap-2 justify-end">
                    <ProductForm product={row.original} userId={"REEMPLAZAR_USER_ID"} variant="icon" />
                    <Button variant="destructive" size="icon" className="h-8 w-8"
                        onClick={async () => { await deleteProduct(row.original.id, "REEMPLAZAR_USER_ID"); }}>
                        🗑️
                    </Button>
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data: data.items,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Card>
            <CardContent className="p-2">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            {table.getHeaderGroups().map(hg => (
                                <tr key={hg.id} className="text-xs">
                                    {hg.headers.map(h => (
                                        <th key={h.id} className="text-left py-2 px-2 font-medium">{h.isPlaceholder ? null : h.column.columnDef.header as any}</th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map(r => (
                                <tr key={r.id} className="border-t">
                                    {r.getVisibleCells().map(c => (
                                        <td key={c.id} className="py-2 px-2">
                                            {flexRender(c.column.columnDef.cell, c.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación simple */}
                <div className="flex items-center justify-end gap-2 p-2">
                    <span className="text-xs">Página {data.page} de {data.pages}</span>
                </div>
            </CardContent>
        </Card>
    );
}
