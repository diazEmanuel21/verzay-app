'use client'

import { ModuleWithItems } from '@/schema/module';
import { create } from 'zustand';
interface ModuleState {
    modules: ModuleWithItems[];
    setModules: (modules: ModuleWithItems[]) => void;
    addModule: (module: ModuleWithItems) => void;
    updateModule: (route: string, updated: Partial<ModuleWithItems>) => void;
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
