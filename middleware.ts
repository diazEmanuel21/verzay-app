import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { canAccessRoute } from "./utils/access";
// const { auth } = NextAuth(authConfig);
const publicRoutes = ["/", "/prices"];
const authRoutes = ["/login", "/register"];
const apiAuthPrefix = "/api/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const currentPath = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role ?? 'user';
  const userPlan = req.auth?.user?.plan ?? 'pymes';

  if (process.env.NODE_ENV !== 'production') {
    console.log({ isLoggedIn, currentPath, userRole, userPlan });
  }

  if (currentPath.startsWith(apiAuthPrefix)) return NextResponse.next();
  if (publicRoutes.includes(currentPath)) return NextResponse.next();

  if (isLoggedIn && authRoutes.includes(currentPath)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && !authRoutes.includes(currentPath) && !publicRoutes.includes(currentPath)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", currentPath);
    return NextResponse.redirect(loginUrl);
  }

  const access = canAccessRoute({ route: currentPath, userRole, userPlan });

  if (!access.allowed) {
    console.warn("Acceso denegado por:", access.reason);
    return NextResponse.redirect(new URL("/credits", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
