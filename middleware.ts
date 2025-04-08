import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/prices"];
const authRoutes = ["/login", "/register"];
const apiAuthPrefix = "/api/auth";

// 🔐 Rutas protegidas por roles
const protectedRoutes: Record<string, string[]> = {
  "/flow": ["empresarial", "business"],
  "/premium": ["empresarial", "business", "admin"]
};

export default auth((req) => {
  const { nextUrl } = req;
  const currentPath = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as Role;

  console.log({ isLoggedIn, currentPath, userRole });

  if (currentPath.startsWith(apiAuthPrefix)) return NextResponse.next();
  if (publicRoutes.includes(currentPath)) return NextResponse.next();

  if (isLoggedIn && authRoutes.includes(currentPath)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && !authRoutes.includes(currentPath) && !publicRoutes.includes(currentPath)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const matchedProtectedRoute = Object.keys(protectedRoutes).find((route) =>
    currentPath.startsWith(route)
  );

  if (matchedProtectedRoute) {
    const allowedRoles = protectedRoutes[matchedProtectedRoute];
    const hasRole = allowedRoles.includes(userRole);

    if (!hasRole) {
      return NextResponse.redirect(new URL("/credits", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
