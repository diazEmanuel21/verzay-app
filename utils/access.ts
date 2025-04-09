// utils/access.ts

import { navLinks } from '@/constants/navLinks';

export function getRouteAccess(route: string) {
  return navLinks.find(link => route.startsWith(link.route));
}

export function canAccessRoute({
  route,
  userRole,
  userPlan,
}: {
  route: string;
  userRole: string;
  userPlan: string;
}) {
  const link = getRouteAccess(route);
  if (!link) return true; // rutas públicas

  if (link.adminOnly && userRole !== 'admin') return false;
 
  if (link.allowedRoles && !link.allowedRoles.includes(userRole)) return false;

  if (link.requiresPremium && userPlan !== 'premium') return false;

  return true;
}
