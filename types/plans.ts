import { Plan } from "@prisma/client";

export const PLANS = Object.values(Plan);
export const PLAN_LABELS: Record<Plan, string> = {
    empresarial: 'Empresarial',
    advanced: 'Lite',
    business: 'Único',
    intermediate: 'Básico',
    pymes: 'Intermedio',
    standard: 'Avanzado',
};

export const PLAN_VALUES = Object.values(Plan) as [Plan, ...Plan[]];
