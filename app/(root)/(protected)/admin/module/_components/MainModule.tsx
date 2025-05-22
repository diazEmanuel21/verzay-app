'use client'

import { useEffect, useState } from 'react';
import { NavLinkItem, navLinks } from '@/constants/navLinks';
import { ModuleCreator } from './ModuleCreator';
import { ModuleForm } from './ModuleForm';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import { ModuleCardSkeleton } from './ModuleCardSkeleton';

export const MainModule = () => {
    const [loading, setloading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredModules, setFilteredModules] = useState<NavLinkItem[]>([]);

    useEffect(() => {
        setTimeout(() => {
            setloading(false)
        }, 2000);

    }, []);

    useEffect(() => {
        const filtered = navLinks.filter((module) =>
            module.label.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredModules(filtered);
    }, [search]);

    const onSave = (module: NavLinkItem) => {
        console.log({ module })

        setFilteredModules((prev) => [...prev, module]);
    }

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
                    <ModuleCreator onSave={onSave} />
                </div>
            </div>
            {/* Scroll interno para el contenido */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-w-[300px] p-2">
                    {loading ? (
                        <ModuleCardSkeleton />
                    ) : (
                        filteredModules.map((navLink) => (
                            <ModuleCard key={navLink.route} navLink={navLink} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}