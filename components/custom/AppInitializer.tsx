'use client'

import { useThemeStore } from '@/stores'
import { useEffect } from 'react'

export default function AppInitializer() {
    const initTheme = useThemeStore((state) => state.initTheme)

    useEffect(() => {
        initTheme()
    }, [])

    return null
}
