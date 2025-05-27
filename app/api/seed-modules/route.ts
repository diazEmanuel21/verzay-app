// app/api/seed-modules/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { navLinksData } from "@/constants/navLinks";

const prisma = new PrismaClient();

export async function POST() {
    try {
        for (const module of navLinksData) {
            await prisma.module.upsert({
                where: { route: module.route },
                update: {},
                create: {
                    label: module.label,
                    route: module.route,
                    icon: module.icon,
                    hiddenModuleToSelector: module.hiddenModuleToSelector,
                    showInSidebar: module.showInSidebar,
                    allowedPlans: module.allowedPlans,
                    adminOnly: module.adminOnly,
                    requiresPremium: module.requiresPremium,
                },
            });
        }

        return NextResponse.json({ success: true, message: "Módulos insertados o actualizados" });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ success: false, error: error });
    } finally {
        await prisma.$disconnect();
    }
}