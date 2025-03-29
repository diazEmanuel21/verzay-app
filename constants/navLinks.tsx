import { 
    HomeIcon, 
    ViewfinderCircleIcon, 
    SparklesIcon, 
    UserIcon,
    UsersIcon,
    ShoppingBagIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon
  } from "@heroicons/react/24/solid";
  
  export const navLinks = [
    {
      label: "Inicio",
      route: "/",
      icon: HomeIcon,
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
    },
    {
      label: "Cuenta",
      route: "/profile",
      icon: UserIcon,
    },
    {
      label: "Leads",
      route: "/sessions",
      icon: UsersIcon, 
    },
    {
      label: "Planes",
      route: "/credits",
      icon: ShoppingBagIcon,
    },
  ];