// app/(dashboard)/products/page.tsx
import { listProducts } from "@/actions/products-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense } from "react";
import { ProductForm, ProductTable } from "./components";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProductsPage({
    searchParams,
}: { searchParams?: { q?: string; page?: string } }) {
    const user = await currentUser();
    if (!user) {
        redirect('/login');
    };
    const q = searchParams?.q ?? "";
    const page = Number(searchParams?.page ?? 1);

    const data = await listProducts({ userId: user.id, q, page, perPage: 20 });

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
                <form className="flex gap-2 min-w-0">
                    <Input
                        name="q"
                        defaultValue={q}
                        placeholder="Buscar por título…"
                        className="h-8 text-sm"
                    />
                    <Button type="submit" className="h-8 px-3 text-xs">Buscar</Button>
                </form>
                <ProductForm userId={user.id} />
            </div>

            <Suspense fallback={<div>Cargando…</div>}>
                <ProductTable data={data} />
            </Suspense>
        </div>
    );
}
