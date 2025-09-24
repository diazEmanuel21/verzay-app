// utils/access.ts
import { ModuleWithItems } from '@/schema/module';
import { Plan } from '@prisma/client';

/**
 * Busca el módulo que corresponde a una ruta específica.
 * Se usa para determinar si una ruta pertenece a algún módulo registrado.
 * 
 * @param route - Ruta actual (por ejemplo: "/dashboard/config")
 * @param modules - Lista de módulos con sus rutas base
 * @returns El módulo correspondiente si lo encuentra, de lo contrario undefined
 */
export function getRouteAccess(route: string, modules: ModuleWithItems[]) {
  return modules.find(module => route.startsWith(module.route));
}

/**
 * Determina si un usuario puede acceder a una ruta basada en:
 * - Rol del usuario (admin o reseller)
 * - Plan actual del usuario
 * - Configuración del módulo correspondiente
 * 
 * @param params.route - Ruta que el usuario intenta acceder
 * @param params.userRole - Rol del usuario (ej. "user", "admin", "reseller")
 * @param params.userPlan - Plan actual del usuario
 * @param params.modules - Lista de todos los módulos con restricciones de acceso
 * @returns Objeto con `allowed: boolean` y una `reason` opcional si está denegado
 */
export function canAccessRoute({
  route,
  userRole,
  userPlan,
  modules,
}: {
  route: string;
  userRole: string;
  userPlan: Plan;
  modules: ModuleWithItems[];
}) {


  // Verifica si el usuario tiene rol administrativo
  const hasAdminRol = userRole === 'admin' || userRole === 'reseller';

  // Busca el módulo correspondiente a la ruta
  const link = getRouteAccess(route, modules);
  if (!link) return { allowed: true };

  if(link.label === 'AI ASSISTENCE') debugger;

  // Restringe acceso si es solo para admins y el usuario no lo es
  if (link.adminOnly && !hasAdminRol) {
    return { allowed: false, reason: 'Only admin' };
  }

  // Verifica si el plan del usuario está permitido para este módulo
  if (link.allowedPlans && !link.allowedPlans.includes(userPlan)) {
    return { allowed: false, reason: 'Invalid plan' };
  }

  // Si pasa todas las validaciones, el acceso está permitido
  return { allowed: true };
}