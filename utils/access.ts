// utils/access.ts

import { NavLinkItem } from '@/constants/navLinks';
import { Plan } from '@prisma/client';

export function getRouteAccess(route: string, modules: NavLinkItem[]) {
  return modules.find(module => route.startsWith(module.route));
}

export function canAccessRoute({
  route,
  userRole,
  userPlan,
  modules
}: {
  route: string;
  userRole: string;
  userPlan: Plan;
  modules: NavLinkItem[]
}) {
  const link = getRouteAccess(route, modules);
  if (!link) return { allowed: true };

  if (link.adminOnly && userRole !== 'admin' && userRole !== 'reseller') return { allowed: false, reason: 'adminOnly' };
  if (link.allowedPlans && !link.allowedPlans.includes(userPlan)) return { allowed: false, reason: 'invalidPlan' };

  return { allowed: true };
}