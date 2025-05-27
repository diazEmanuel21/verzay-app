import { z } from "zod"
import { Module, ModuleItem, Plan } from "@prisma/client";
import {
    ShieldCheckIcon,
    ChartPieIcon,
    BookOpenIcon,
    ViewfinderCircleIcon,
    SparklesIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleBottomCenterTextIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    BellAlertIcon,
    DocumentTextIcon,
    ChatBubbleLeftEllipsisIcon,
    FunnelIcon
} from "@heroicons/react/24/solid";

export const iconMap = {
    ShieldCheckIcon,
    ChartPieIcon,
    BookOpenIcon,
    ViewfinderCircleIcon,
    SparklesIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleBottomCenterTextIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    BellAlertIcon,
    DocumentTextIcon,
    ChatBubbleLeftEllipsisIcon,
    FunnelIcon,
};

const PlanValues = Object.values(Plan) as [Plan, ...Plan[]];

export const ItemModuleSchema = z.object({
    url: z.string().min(1),
    title: z.string().min(1),
})

export const FormModuleSchema = z.object({
    label: z.string().min(1, "Campo requerido"),
    route: z.string().min(1, "Campo requerido"),
    icon: z.string().min(1, "Campo requerido"),
    showInSidebar: z.boolean().default(true),
    hiddenModuleToSelector: z.boolean().default(false),
    adminOnly: z.boolean().default(false),
    requiresPremium: z.boolean().default(false),
    allowedPlans: z.array(z.enum(PlanValues)),
    items: z.array(ItemModuleSchema).optional(),
})

export type FormModuleValues = z.infer<typeof FormModuleSchema>

export type ModuleWithItems = Module & {
  items: ModuleItem[];
};