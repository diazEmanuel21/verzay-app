'use client'

import { useRouter } from 'next/navigation'
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'
import { updateModuleOrder } from '@/actions/module-actions'
import { ModuleWithItems } from '@/schema/module'
import { toast } from 'sonner'

interface SortableListProps {
    modules: ModuleWithItems[]
}

export function SortableModuleList({ modules }: SortableListProps) {
    const router = useRouter();

    const [items, setItems] = useState(modules)

    useEffect(() => {
        setItems(modules)
    }, [modules])

    const sensors = useSensors(useSensor(PointerSensor))

    const handleDragEnd = async (event: DragEndEvent) => {

        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        setItems(newOrder)

        const toastId = toast.loading("Actualizando orden...")

        try {
            await Promise.all(
                newOrder.map((mod, index) =>
                    updateModuleOrder(mod.id, index)
                )
            )
            toast.success("Orden actualizado correctamente", { id: toastId })
        } catch (err) {
            console.error('Error al actualizar orden:', err)
            toast.error("Error al guardar el orden", { id: toastId })
        }

        router.refresh()
    }

    if (!items || items.length === 0) {
        return (
            <div className="text-muted-foreground text-sm">
                No hay módulos disponibles para ordenar.
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {items.map((module) => (
                        <SortableItem key={module.id} module={module} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

function SortableItem({ module }: { module: ModuleWithItems }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: module.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-4 cursor-grab border border-border shadow-sm rounded-lg bg-white dark:bg-gray-900"
        >
            <div className="text-sm font-medium">{module.label}</div>
            <Button variant="ghost" size="icon" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
        </Card>
    )
}