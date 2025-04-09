import {
  ViewfinderCircleIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

export interface NavLinkItem {
  label: string;
  route: string;
  icon: any;
  showInSidebar?: boolean;
  allowedRoles?: string[];
  requiresPremium?: boolean;
  adminOnly?: boolean;
}

export const navLinks: NavLinkItem[] = [
  {
    label: "Admin",
    route: "/admin",
    icon: ShieldCheckIcon,
    adminOnly: true,
    showInSidebar: true,
  },
  {
    label: "Conexión",
    route: "/dashboard",
    icon: ViewfinderCircleIcon,
    showInSidebar: true,
  },
  {
    label: "Crear IA",
    route: "/ia/add/create",
    icon: SparklesIcon,
    showInSidebar: true,
  },
  {
    label: "Leads",
    route: "/sessions",
    icon: UsersIcon,
    showInSidebar: true,
  },
  {
    label: "Flujos",
    route: "/flow",
    icon: ChatBubbleLeftRightIcon,
    requiresPremium: true,
    allowedRoles: ["empresarial", "business"],
    showInSidebar: true,
  },
  {
    label: "Herramientas",
    route: "/tools",
    icon: ClipboardDocumentListIcon,
    requiresPremium: true,
    allowedRoles: ["empresarial", "business"],
    showInSidebar: true,
  },
  {
    label: "Respuestas rápidas",
    route: "/auto-replies",
    icon: ChatBubbleBottomCenterTextIcon,
    requiresPremium: true,
    showInSidebar: true,
  },
];
