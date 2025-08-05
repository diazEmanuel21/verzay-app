import { Plan } from "@prisma/client";

export const PLANS = Object.values(Plan);
export const PLAN_LABELS: Record<Plan, string> = {
    admin: 'Admin',
    lite: 'Lite',
    unico: 'Único',
    basico: 'Básico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
    personalizado: 'Personalizado',
};

export const PLAN_VALUES = Object.values(Plan) as [Plan, ...Plan[]];
