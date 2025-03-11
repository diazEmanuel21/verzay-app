"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Crear usuario
export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("Name, Email and Password are required.");
  }

  await db.user.create({
    data: {
      name,
      email,
      password, // 🚨 Aquí se guarda en texto plano, mejor agregar hashing luego
      emailVerified: new Date(),
    },
  });

  revalidatePath("/clientes");
}

// Editar usuario
export async function updateUser(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!id || !name || !email) {
    throw new Error("Invalid data.");
  }

  // Creamos el objeto de update dinámicamente
  const updateData: { name: string; email: string; password?: string } = {
    name,
    email,
  };

  // Si envías un nuevo password lo actualizamos
  if (password && password.length > 0) {
    updateData.password = password; // 🚨 Hashear después!
  }

  await db.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/clientes");
}

// Eliminar usuario
export async function deleteUser(id: string) {
  if (!id) {
    throw new Error("User ID is required.");
  }

  await db.user.delete({
    where: { id },
  });

  revalidatePath("/clientes");
}
