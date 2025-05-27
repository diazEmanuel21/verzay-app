'use client'

import { useEffect } from 'react'
import { ThemeApp } from '@prisma/client'
import { ResellerInfoResponse } from '@/schema/reseller';
import { useThemeStore } from '@/stores'
import { useResellerStore } from '@/stores/resellers/resellerStore';
import { NavLinkItem } from '@/constants/navLinks';
import { useModuleStore } from '@/stores/modules/useModuleStore';

interface AppInitializerInterface {
    onReseller: ResellerInfoResponse
    modules: NavLinkItem[]
};

export default function AppInitializer({ onReseller, modules }: AppInitializerInterface) {
    const { initTheme } = useThemeStore();
    const { setReseller, clearReseller } = useResellerStore();
    const { setModules } = useModuleStore();

    const theme: ThemeApp = onReseller.success
        ? onReseller.data?.theme ?? 'Default'
        : 'Default';


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