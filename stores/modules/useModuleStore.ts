'use client'

import { ModuleWithItems } from '@/schema/module';
import { create } from 'zustand';
interface ModuleState {
    modules: ModuleWithItems[];
    setModules: (modules: ModuleWithItems[]) => void;
}

export const useModuleStore = create<ModuleState>((set, get) => ({
    modules: [], // Inicializa con los módulos base
    setModules: (modules) => set({ modules }),
}));
