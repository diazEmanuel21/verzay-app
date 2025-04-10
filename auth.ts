import NextAuth, { DefaultSession } from "next-auth";

import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { Plan, Role, User } from "@prisma/client";


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      plan: Plan;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    // jwt() se ejecuta cada vez que se crea o actualiza un token JWT.
    // Aquí es donde puedes agregar información adicional al token.
    jwt({ token, user }) {
      if (user) {
        const u = user as User;
        token.id = u.id;
        token.role = u.role;
        token.plan = u.plan;
    
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.plan = token.plan as Plan;
      }
      return session;
    }
  },
  events: {
    // El evento linkAccount se dispara cuando una cuenta (proveedor OAuth: GitHub, Google, Facebook, etc.)  se vincula a un usuario existente en tu base de datos.
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },
  pages: {
    signIn: "/login",
  },
});
