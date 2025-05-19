'use client'

import { useThemeStore } from '@/stores'
import { ThemeApp } from '@prisma/client'
import { useEffect } from 'react'

export default function AppInitializer({ colorTheme }: { colorTheme: ThemeApp }) {
    const initTheme = useThemeStore((state) => state.initTheme);

    useEffect(() => {
        initTheme(colorTheme)
    }, [])

    return null
}
