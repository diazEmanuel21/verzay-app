'use client'

import { create } from 'zustand';
import { NavLinkItem } from '@/constants/navLinks'; // Ajusta la ruta si es diferente

interface ModuleState {
    modules: NavLinkItem[];
    setModules: (modules: NavLinkItem[]) => void;
    addModule: (module: NavLinkItem) => void;
    updateModule: (route: string, updated: Partial<NavLinkItem>) => void;
    removeModule: (route: string) => void;
    resetModules: () => void;
}

export const useModuleStore = create<ModuleState>((set, get) => ({
    modules: [], // Inicializa con los módulos base

    setModules: (modules) => set({ modules }),

    addModule: (module) =>
        set((state) => ({
            modules: [...state.modules, module],
        })),

    updateModule: (route, updated) =>
        set((state) => ({
            modules: state.modules.map((mod) =>
                mod.route === route ? { ...mod, ...updated } : mod
            ),
        })),

    removeModule: (route) =>
        set((state) => ({
            modules: state.modules.filter((mod) => mod.route !== route),
        })),

    resetModules: () => set({ modules: [] }),
}));
