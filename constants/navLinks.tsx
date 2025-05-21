import {
  ViewfinderCircleIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  BellAlertIcon
} from "@heroicons/react/24/solid";

export interface NavLinkItem {
  label: string;
  route: string;
  icon: any;
  showInSidebar?: boolean;
  allowedPlans?: string[];
  adminOnly?: boolean;
  requiresPremium?: boolean;
  items?: {
    url: string,
    title: string,
  }[]
}

export const navLinks: NavLinkItem[] = [
  {
    label: "Admin",
    route: "/admin",
    icon: ShieldCheckIcon,
    adminOnly: true,
    showInSidebar: true,
    items: [
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
    label: "Conexión",
    route: "/dashboard",
    icon: ViewfinderCircleIcon,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
  },
  {
    label: "Crear IA",
    route: "/ia/add/create",
    icon: SparklesIcon,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
  },
  {
    label: "Leads",
    route: "/sessions",
    icon: UsersIcon,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
  },
  {
    label: "Flujos",
    route: "/flow",
    icon: ChatBubbleLeftRightIcon,
    allowedPlans: ["empresarial", "business"],
    showInSidebar: true,
    requiresPremium: true,
  },
  {
    label: "Herramientas",
    route: "/tools",
    icon: ClipboardDocumentListIcon,
    allowedPlans: ["empresarial", "business"],
    showInSidebar: true,
    requiresPremium: true,
  },
  {
    label: "Recordatorios",
    route: "/reminders",
    icon: BellAlertIcon,
    showInSidebar: true,
    allowedPlans: ["pymes", "empresarial", "business"],
    requiresPremium: true,
  },
  {
    label: "Respuestas rápidas",
    route: "/auto-replies",
    icon: ChatBubbleBottomCenterTextIcon,
    allowedPlans: ["empresarial", "business"],
    showInSidebar: true,
    requiresPremium: true,
  },
  {
    label: "Ajustes de perfil",
    route: "/profile",
    icon: Cog6ToothIcon,
    adminOnly: false,
    showInSidebar: true,
    requiresPremium: false,
  },
];
