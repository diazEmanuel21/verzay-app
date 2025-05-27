// scripts/seed-modules.ts
import { NavLinkItem, navLinksData } from "@/constants/navLinks";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    for (const module of navLinksData) {
        await prisma.module.upsert({
            where: { route: module.route },
            update: {}, // Si quieres actualizar valores, agrégalo aquí
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

    console.log("✅ Módulos insertados o actualizados");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());