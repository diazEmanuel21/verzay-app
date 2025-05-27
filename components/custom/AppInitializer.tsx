'use client'

import { useEffect } from 'react'
import { ThemeApp, User } from '@prisma/client'
import { useModuleStore } from '@/stores/modules/useModuleStore';
import { ResellerInfoResponse } from '@/schema/reseller';
import { useThemeStore } from '@/stores'
import { useResellerStore } from '@/stores/resellers/resellerStore';
import { NavLinkItem } from '@/schema/module';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessRoute } from '@/utils/access';

interface AppInitializerInterface {
    onReseller: ResellerInfoResponse
    modules: NavLinkItem[]
    user: User
};

export default function AppInitializer({ onReseller, modules, user }: AppInitializerInterface) {
    const pathname = usePathname();
    const router = useRouter();
    const { initTheme } = useThemeStore();
    const { setReseller, clearReseller } = useResellerStore();
    const { setModules } = useModuleStore();

    const theme: ThemeApp = onReseller.success
        ? onReseller.data?.theme ?? 'Default'
        : 'Default';

    useEffect(() => {
        const access = canAccessRoute({
            route: pathname,
            userRole: user.role,
            userPlan: user.plan,
            modules,
        });

        if (!access.allowed) {
            console.warn("Acceso denegado por:", access.reason);
            router.push("/credits"); // 👈 redirección en cliente
        }
    }, [pathname, user.role, user.plan, modules, router]);

    //Setear modulos de la app
    useEffect(() => {
        setModules(modules)
    }, [modules, setModules])

    // Aplicar theme visual al montar o al cambiar
    useEffect(() => {
        initTheme(theme)
    }, [theme, initTheme])

    // Guardar información de reseller (cliente o propio)
    useEffect(() => {
        if (onReseller.success && onReseller.data) {
            setReseller(onReseller.data)
        } else {
            clearReseller();
        }
    }, [onReseller, setReseller])

    return null
}