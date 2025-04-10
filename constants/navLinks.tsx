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
  allowedPlans?: string[];
  adminOnly?: boolean;
  requiresPremium?: boolean;
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
    label: "Respuestas rápidas",
    route: "/auto-replies",
    icon: ChatBubbleBottomCenterTextIcon,
    allowedPlans: ["empresarial", "business"],
    showInSidebar: true,
    requiresPremium: true,
  },
];
