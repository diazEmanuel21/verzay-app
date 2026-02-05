"use server";

import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { z } from "zod";

export const loginAction = async (values: z.infer<typeof loginSchema>) => {
  try {
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message };
    }
    return { error: "error 500" };
  }
};

export async function impersonateUser(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "No auth" };

  // ✅ Solo admin (ajusta si reseller también aplica)
  if (session.user.role !== "admin") {
    return { success: false, message: "No autorizado" };
  }

  // opcional: validar que existe el usuario target
  const exists = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!exists) return { success: false, message: "Usuario no existe" };

  cookies().set("impersonate_user_id", targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}

export const registerAction = async (
  values: z.infer<typeof registerSchema>
) => {
  try {
    const { data, success } = registerSchema.safeParse(values);
    if (!success) {
      return {
        error: "Invalid data",
      };
    }

    // verificar si el usuario ya existe
    const user = await db.user.findUnique({
      where: {
        email: data.email,
      },
      include: {
        accounts: true, // Incluir las cuentas asociadas
      },
    });

    if (user) {
      // Verificar si tiene cuentas OAuth vinculadas
      const oauthAccounts = user.accounts.filter(
        (account) => account.type === "oauth"
      );
      if (oauthAccounts.length > 0) {
        return {
          error:
            "To confirm your identity, sign in with the same account you used originally.",
        };
      }
      return {
        error: "User already exists",
      };
    }

    // hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // crear el usuario
    await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: passwordHash,
      },
    });

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message };
    }
    return { error: "error 500" };
  }
};

export async function changePasswordAction(newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No auth");

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: session.user.id },
    data: {
      password: passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  return { success: true };
}