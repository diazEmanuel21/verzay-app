import { Plan } from "@prisma/client";

export const PLANS = Object.values(Plan);
export const PLAN_LABELS: Record<Plan, string> = {
    business: 'Business',
    empresarial: 'Empresarial',
    pymes: 'Pymes',
    advanced: 'Avanzado',
    intermediate: 'Intermedio ',
    standard: 'Estándar',
};

export const PLAN_COLORS: Record<Plan, string> = {
    standard: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',       // Básico → neutral
    intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300', // Nivel medio → más cálido
    advanced: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300', // Alto nivel → sofisticado
    pymes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',   // Comercial → accesible
    business: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',           // Corporativo → estable
    empresarial: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300', // Élite → confianza y prestigio
};

export const PLAN_VALUES = Object.values(Plan) as [Plan, ...Plan[]];
