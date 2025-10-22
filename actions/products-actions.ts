// actions/products-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { listParams, productSchema } from "@/lib/validators/product";
import { db } from "@/lib/db"; // tu prisma client
import { Prisma } from "@prisma/client";

export async function listProducts(raw: z.input<typeof listParams>) {
    const { userId, q, page, perPage, onlyActive } = listParams.parse(raw);

    const where: Prisma.ProductWhereInput = {
        userId,
        ...(onlyActive ? { isActive: true } : {}),
        ...(q ? { title: { contains: q, mode: Prisma.QueryMode.insensitive } } : {}),
    };

    const [items, total] = await Promise.all([
        db.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        db.product.count({ where }),
    ]);

    // 🔧 normalizamos el tipo Decimal → number
    const normalized = items.map(p => ({
        ...p,
        price: Number(p.price),
    }));

    return {
        items: normalized,
        total,
        page,
        perPage,
        pages: Math.ceil(total / perPage),
    };

}

export async function createProduct(raw: unknown) {
    const input = productSchema.omit({ id: true }).parse(raw);
    const product = await db.product.create({ data: input });
    revalidatePath("/products");
    return product;
}

export async function updateProduct(id: string, raw: unknown) {
    // 1️⃣ Validar con Zod
    const input = productSchema.partial({ id: true }).parse(raw);

    // 2️⃣ Excluir userId del update (no se debe tocar el FK)
    const { id: _omit, userId: _ignore, ...data } = input;

    // 3️⃣ Ejecutar el update limpio
    const product = await db.product.update({
        where: { id },
        data,
    });

    revalidatePath("/products");
    return product;
}

export async function deleteProduct(id: string, userId: string) {
    await db.product.delete({ where: { id } });
    revalidatePath("/products");
    return { ok: true };
}
