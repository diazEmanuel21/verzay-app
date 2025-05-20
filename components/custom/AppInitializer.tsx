'use client'

import { useEffect } from 'react'
import { ThemeApp } from '@prisma/client'
import { ResellerInfoResponse } from '@/schema/reseller';
import { useThemeStore } from '@/stores'
import { useResellerStore } from '@/stores/resellers/resellerStore';

export default function AppInitializer({ onReseller }: { onReseller: ResellerInfoResponse }) {
    const initTheme = useThemeStore((s) => s.initTheme)
    const setReseller = useResellerStore((s) => s.setReseller)

    const theme: ThemeApp = onReseller.success
        ? onReseller.data?.theme ?? 'Default'
        : 'Default';

    // Aplicar theme visual al montar o al cambiar
    useEffect(() => {
        initTheme(theme)
    }, [theme, initTheme])

    // Guardar información de reseller (cliente o propio)
    useEffect(() => {
        if (onReseller.success && onReseller.data) {
            setReseller(onReseller.data)
        }
    }, [onReseller, setReseller])

    return null
}