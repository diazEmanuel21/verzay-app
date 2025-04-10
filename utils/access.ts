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
  if (!link) return { allowed: true };

  if (link.adminOnly && userRole !== 'admin') return { allowed: false, reason: 'adminOnly' };
  if (link.allowedPlans && !link.allowedPlans.includes(userPlan)) return { allowed: false, reason: 'invalidPlan' };

  return { allowed: true };
}