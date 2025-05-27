'use client'

import { useState } from 'react';
import { NavLinkItem } from "@/constants/navLinks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, EyeOff, Eye, Star, Edit2Icon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { iconMap } from "@/schema/module"
import { GenericDeleteDialog } from "@/components/shared/GenericDeleteDialog"
import { useModuleStore } from "@/stores/modules/useModuleStore"
import { deleteManual } from '@/actions/manual-actions';

export const ModuleCard = ({
    module,
    setOpenModule }: {
        module: NavLinkItem
        setOpenModule: (state: boolean) => void
    }) => {
    const { removeModule } = useModuleStore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const Icon = iconMap[module.icon as keyof typeof iconMap];

    const onDeleteModule = async () => {
        await deleteManual('')
        removeModule(module.route)
    };

    return (
        <Card className="
                group
                relative 
                border-border      
                transition-all 
                duration-300 
                hover:shadow-lg 
                hover:scale-[1.015] 
                hover:border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    {module.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{module.route}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {module.adminOnly && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Solo admin
                    </Badge>
                )}
                {module.requiresPremium && (
                    <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-4 w-4" /> Premium
                    </Badge>
                )}
                <div className="flex items-center gap-2">
                    {module.showInSidebar
                        ? <Badge variant="outline" className="flex items-center gap-1"><Eye className="h-4 w-4" /> Sidebar</Badge>
                        : <Badge variant="destructive" className="flex items-center gap-1"><EyeOff className="h-4 w-4" /> Oculto</Badge>}
                </div>
                {module.allowedPlans && module.allowedPlans.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {module.allowedPlans.map(plan => (
                            <Badge key={plan} variant="outline">{plan}</Badge>
                        ))}
                    </div>
                )}
                {module.items && module.items.length > 0 && (
                    <div className="mt-4">
                        <p className="font-medium mb-1">Submódulos:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {module.items.map((item, index) => (
                                <li key={index}>
                                    <span className="font-medium">{item.title}</span> – <span className="text-xs">{item.url}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" onClick={() => setOpenModule(true)}>
                        <Edit2Icon />
                    </Button>

                    <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 />
                    </Button>

                    <GenericDeleteDialog
                        open={showDeleteDialog}
                        setOpen={setShowDeleteDialog}
                        itemName={'modulo'}
                        itemId={module.route}
                        mutationFn={() => onDeleteModule()}
                        entityLabel="modulo"
                    />
                </div>
            </CardContent>
        </Card>
    )
}