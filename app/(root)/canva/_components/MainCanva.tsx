'use client'

import IframeRenderer from "@/components/custom/IframeRenderer";
import { useModuleStore } from "@/stores/modules/useModuleStore";
import { Module } from "@prisma/client";

export const MainCanva = ({ modules }: { modules: Module[] }) => {
    const { labelModule } = useModuleStore();
    const currentModule = modules?.find(m => m.label === labelModule);
    if (!currentModule?.customUrl) return <h1>No se encontró una URL  para el iframe</h1>

    return <IframeRenderer url={currentModule?.customUrl ?? ''} />;
}
