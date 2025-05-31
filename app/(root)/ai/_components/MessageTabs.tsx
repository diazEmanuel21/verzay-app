'use client'

import { useState } from 'react'
import { PromptTabsProps } from '@/schema/ai'
import { TypePromptAi } from '@prisma/client'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export function MessageTabs({
    messages,
    debouncedSearchTerm = '',
    highlightMatch,
    truncateMessage,
    openEditDialog,
    confirmDelete,
    loading = false,
}: PromptTabsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [toDeleteId, setToDeleteId] = useState<string | null>(null)

    //TODO: APLICAR
    const TYPE_LABELS: Record<TypePromptAi, string> = {
        [TypePromptAi.TRAINING]: 'Entrenamiento',
        [TypePromptAi.FAQs]: 'Preguntas frecuentes',
        [TypePromptAi.ACTIONS]: 'Acciones',
    };

    const enumKeys = Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[];

    const handleDelete = () => {
        if (toDeleteId) {
            confirmDelete(toDeleteId)
            setDeleteDialogOpen(false)
        }
    }

    return (
        <Tabs defaultValue="Entrenamiento" className="w-full">
            <TabsList className="mb-4">
                {enumKeys.map((cat) => (
                    <TabsTrigger key={cat} value={cat}>
                        {TYPE_LABELS[cat]}
                    </TabsTrigger>
                ))}
            </TabsList>

            {enumKeys.map((cat) => {
                const filteredMessages = messages.filter((msg) => msg.typePrompt === cat)
                return (
                    <TabsContent key={cat} value={cat}>
                        <div className="flex flex-col gap-2">
                            {filteredMessages.length === 0 && (
                                <p className="text-sm text-muted-foreground">No hay mensajes en esta categoría.</p>
                            )}
                            {filteredMessages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    className="p-4 flex justify-between items-start border-border"
                                >
                                    <div>
                                        <h4 className="text-base font-medium">
                                            {highlightMatch(msg.title?.toUpperCase() ?? '', debouncedSearchTerm)}
                                        </h4>
                                        <p
                                            className="text-sm text-muted-foreground cursor-pointer hover:underline"
                                            onClick={() => openEditDialog(msg)}
                                        >
                                            {highlightMatch(truncateMessage(msg.message, 100), debouncedSearchTerm)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="bg-orange-500 text-white hover:bg-orange-600"
                                            size="icon"
                                            onClick={() => openEditDialog(msg)}
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </Button>

                                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => {
                                                        setToDeleteId(msg.id)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </Button>
                                            </AlertDialogTrigger>

                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. ¿Estás seguro de eliminar este mensaje?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setDeleteDialogOpen(false)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleDelete}
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Eliminando...' : 'Eliminar'}
                                                    </Button>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                )
            })}
        </Tabs>
    )
}
