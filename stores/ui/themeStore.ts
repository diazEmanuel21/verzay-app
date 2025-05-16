// stores/useThemeStore.ts
'use client'

import { create } from 'zustand'

type Brand = 'verzay' | 'aizen bots' | 'wat bot'

export const themes: Record<Brand, Record<string, string>> = {
    verzay: {
        '--primary': '221.2 83.2% 53.3',
        '--blue-50': '210 100% 97%',
        '--blue-100': '210 95% 90%',
        '--blue-200': '210 90% 80%',
        '--blue-300': '210 85% 70%',
        '--blue-400': '210 80% 60%',
        '--blue-500': '221.2 83.2% 53.3%',
        '--blue-600': '210 70% 40%',
        '--blue-700': '210 65% 30%',
        '--blue-800': '210 60% 20%',
        '--blue-900': '210 55% 10%',
    },
    'aizen bots': {
        '--primary': '290 100% 65%',
        '--blue-50': '270 100% 97%',
        '--blue-100': '270 90% 90%',
        '--blue-200': '270 85% 80%',
        '--blue-300': '270 80% 70%',
        '--blue-400': '270 75% 60%',
        '--blue-500': '270 70% 50%',
        '--blue-600': '270 65% 40%',
        '--blue-700': '270 60% 30%',
        '--blue-800': '270 55% 20%',
        '--blue-900': '270 50% 10%',
    },
    'wat bot': {
        '--primary': '10 100% 60%',
        '--blue-50': '15 100% 97%',
        '--blue-100': '15 95% 90%',
        '--blue-200': '15 90% 80%',
        '--blue-300': '15 85% 70%',
        '--blue-400': '15 80% 60%',
        '--blue-500': '15 75% 50%',
        '--blue-600': '15 70% 40%',
        '--blue-700': '15 65% 30%',
        '--blue-800': '15 60% 20%',
        '--blue-900': '15 55% 10%',
    },
}

interface ThemeStore {
    current: Brand
    setTheme: (brand: Brand) => void
    initTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
    current: 'verzay',

    setTheme: (brand) => {
        const vars = themes[brand]
        Object.entries(vars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value)
        })
        localStorage.setItem('theme_brand', brand)
        set({ current: brand })
    },

    initTheme: () => {
        const envBrand = (process.env.NEXT_PUBLIC_BRAND || 'verzay') as Brand
        const saved = localStorage.getItem('theme_brand') as Brand | null
        const brandToUse = themes[saved || envBrand] ? (saved || envBrand) : 'verzay'
        const vars = themes[brandToUse]
        Object.entries(vars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value)
        })
        set({ current: brandToUse })
    },
}))