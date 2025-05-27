'use client'

import { useEffect, useState } from 'react';
import { ModuleCreator } from './ModuleCreator';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import { ModuleCardSkeleton } from './ModuleCardSkeleton';
import { useModuleStore } from '@/stores/modules/useModuleStore';
import { toast } from 'sonner';
import { FormModuleValues, NavLinkItem } from '@/schema/module'
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModuleForm } from "./ModuleForm"
import { Button } from '@/components/ui/button';

export const MainModule = () => {
    const { addModule, updateModule } = useModuleStore();
    const { modules } = useModuleStore();

    const [loading, setloading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredModules, setFilteredModules] = useState<NavLinkItem[]>([]);

    /* Dialgos state */
    const [openModuleCreator, setOpenModuleCreator] = useState(false);
    const [editData, setEditData] = useState<{ state: boolean, module?: NavLinkItem }>({
        state: false,
        module: undefined
    });

    useEffect(() => {
        setTimeout(() => {
            setloading(false)
        }, 2000);

    }, []);

    useEffect(() => {
        const filtered = modules.filter((module) =>
            module.label.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredModules(filtered);
    }, [search]);

    const setEditModule = (state: boolean = true, module: NavLinkItem) => {
        setEditData({ state, module });
    };

    const onSubmit = (data: FormModuleValues) => {
        const isEditing = modules.some((mod) => mod.route === data.route);

        if (isEditing) {
            updateModule(data.route, data);
            toast.success('Módulo actualizado correctamente')
        } else {
            addModule(data);
            toast.success(
                toast.success('Módulo creado correctamente')
            );
        }
        // Cerrar el diálogo de creación/edición
        setOpenModuleCreator(false);
        setEditData({ state: false }); // Asegura cerrar modo edición también
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header y Filtro */}
            <div className="sticky top-0 z-1 mb-6">
                <div className="flex justify-between items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar módulo..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <ModuleCreator
                        onSave={onSubmit}
                        openModule={openModuleCreator}
                        setOpenModule={setOpenModuleCreator}

                    />
                </div>
            </div>
            {/* Scroll interno para el contenido */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-[300px] p-2">
                    {loading ? (
                        <ModuleCardSkeleton />
                    ) : (
                        filteredModules.map((module) => (
                            <ModuleCard
                                key={module.route}
                                module={module}
                                setOpenModule={() => setEditModule(true, module)}
                            />
                        ))
                    )}
                </div>
            </div>
            <Dialog open={editData.state} onOpenChange={() => setEditData({ state: false })}>
                <DialogContent className="border-border">
                    <DialogHeader>
                        <DialogTitle>Edición de módulos</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] overflow-y-auto">
                        <ModuleForm onSubmit={onSubmit} defaultValues={editData.module} />
                    </ScrollArea>
                    <DialogFooter>
                        <Button form="module-form" type="submit">Editar módulo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}