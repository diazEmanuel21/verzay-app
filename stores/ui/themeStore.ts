// stores/useThemeStore.ts
import { create } from 'zustand'

type Brand = 'verzay' | 'aizen bots' | 'wat bot'

export const themes: Record<Brand, Record<string, string>> = {
    verzay: {
        '--primary': '214.8 100% 50%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--accent': '210 40% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--background': '0 0% 100%',
        '--foreground': '222.2 84% 4.9%',

        // Blue palette
        '--blue-50': '210 100% 97%',
        '--blue-100': '210 95% 90%',
        '--blue-200': '210 90% 80%',
        '--blue-300': '210 85% 70%',
        '--blue-400': '210 80% 60%',
        '--blue-500': '210 75% 50%',
        '--blue-600': '210 70% 40%',
        '--blue-700': '210 65% 30%',
        '--blue-800': '210 60% 20%',
        '--blue-900': '210 55% 10%',
    },

    'aizen bots': {
        '--primary': '290 100% 65%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '230 30% 96%',
        '--secondary-foreground': '230 60% 10%',
        '--accent': '280 70% 85%',
        '--accent-foreground': '290 100% 25%',
        '--background': '280 20% 98%',
        '--foreground': '230 80% 10%',

        // Aizen blue = morado/indigo
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
        '--primary-foreground': '0 0% 100%',
        '--secondary': '20 70% 95%',
        '--secondary-foreground': '20 70% 20%',
        '--accent': '35 100% 80%',
        '--accent-foreground': '20 100% 20%',
        '--background': '35 40% 98%',
        '--foreground': '20 80% 10%',

        // WatBot blue = naranja-rojizo
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
};


interface ThemeStore {
    current: Brand
    setTheme: (brand: Brand) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
    current: 'verzay',
    setTheme: (brand) => {
        const vars = themes[brand]
        Object.entries(vars).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value)
        })
        set({ current: brand })
    },
}))
