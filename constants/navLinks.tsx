import { Plan } from "@prisma/client";
export interface NavLinkItem {
    label: string;
    route: string;
    icon: string;
    hiddenModuleToSelector: boolean;
    showInSidebar: boolean;
    allowedPlans: Plan[];
    adminOnly: boolean;
    requiresPremium: boolean;
    items?: {
        url: string,
        title: string,
    }[]
}

export const navLinksData: NavLinkItem[] = [
  {
    label: "Admin",
    route: "/admin",
    icon: 'ShieldCheckIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: true,
    requiresPremium: false,
    items: [
      {
        url: '/admin/module',
        title: 'Módulos',
      },
      {
        url: '/admin/conexion',
        title: 'API',
      },
      {
        url: '/admin/clientes',
        title: 'Clientes',
      },
      {
        url: '/admin/reseller',
        title: 'Resellers',
      },
      {
        url: '/admin/documentation',
        title: 'Documentación',
      },
    ]
  },
  {
    label: "Dashboard",
    route: "/dashboard",
    icon: 'ChartPieIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Guías",
    route: "/documentation",
    icon: 'BookOpenIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Plantillas",
    route: "/templates",
    icon: 'DocumentTextIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Conexión",
    route: "/connection",
    icon: 'ViewfinderCircleIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Crear IA",
    route: "/ia/add/create",
    icon: 'SparklesIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Chats",
    route: "/chats",
    icon: 'ChatBubbleLeftEllipsisIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Leads",
    route: "/sessions",
    icon: 'UsersIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
  {
    label: "Flujos",
    route: "/flow",
    icon: 'ChatBubbleLeftRightIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: true,
  },
  {
    label: "Campañas",
    route: "/campaigns",
    icon: 'FunnelIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: true,
  },
  {
    label: "Herramientas",
    route: "/tools",
    icon: 'ClipboardDocumentListIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["empresarial", "business"],
    adminOnly: false,
    requiresPremium: true,
  },
  {
    label: "Recordatorios",
    route: "/reminders",
    icon: 'BellAlertIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: true,
  },
  {
    label: "Respuestas rápidas",
    route: "/auto-replies",
    icon: 'ChatBubbleBottomCenterTextIcon',
    hiddenModuleToSelector: false,
    showInSidebar: true,
    allowedPlans: ["empresarial", "business"],
    adminOnly: false,
    requiresPremium: true,
  },
  {
    label: "Ajustes de perfil",
    route: "/profile",
    icon: 'Cog6ToothIcon',
    hiddenModuleToSelector: true,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    adminOnly: false,
    requiresPremium: false,
  },
];
