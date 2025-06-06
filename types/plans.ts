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

export const PLAN_VALUES = Object.values(Plan) as [Plan, ...Plan[]];
