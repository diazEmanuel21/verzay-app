import {
  ViewfinderCircleIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";

export const navLinks = [
  // {
  //   label: "Inicio",
  //   route: "/",
  //   icon: HomeIcon,
  // },
  {
    label: "Admin",
    route: "/admin",
    icon: ShieldCheckIcon,
    adminOnly: true
  },
  {
    label: "Conexión",
    route: "/dashboard",
    icon: ViewfinderCircleIcon,
  },
  {
    label: "Crear IA",
    route: "/ia/add/create",
    icon: SparklesIcon,
  },
  {
    label: "Herramientas",
    route: "/tools",
    icon: ClipboardDocumentListIcon,
  },
  {
    label: "Flujos",
    route: "/flow",
    icon: ChatBubbleLeftRightIcon,
    premium: true
  },
  {
    label: "Leads",
    route: "/sessions",
    icon: UsersIcon,
  },
  {
    label: "Respuestas rapidas",
    route: "/auto-replies",
    icon: ChatBubbleBottomCenterTextIcon,
    premium: true
  },
  // {
  //   label: "Planes",
  //   route: "/credits",
  //   icon: ShoppingBagIcon,
  // },
  // {
  //   label: "Cuenta",
  //   route: "/profile",
  //   icon: UserIcon,
  // },
];