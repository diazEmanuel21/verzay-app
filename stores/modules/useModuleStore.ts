'use client'

import { ModuleWithItems } from '@/schema/module';
import { create } from 'zustand';
interface ModuleState {
    modules: ModuleWithItems[];
    labelModule: string | null
    setModules: (modules: ModuleWithItems[]) => void;
    setLabelModule: (label: string) => void

}

export const useModuleStore = create<ModuleState>((set, get) => ({
    modules: [], // Inicializa con los módulos base
    labelModule: null,

    setModules: (modules) => set({ modules }),
    setLabelModule: (label) => set({ labelModule: label }),
}));
