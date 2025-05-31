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
import { GenericDeleteDialog } from '@/components/shared/GenericDeleteDialog'
import { deletePromptAi } from '@/actions/ai-actions'

export function MessageTabs({
    messages,
    debouncedSearchTerm = '',
    highlightMatch,
    truncateMessage,
    openEditDialog,
}: PromptTabsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const TYPE_LABELS: Record<TypePromptAi, string> = {
        [TypePromptAi.TRAINING]: 'Entrenamiento',
        [TypePromptAi.FAQs]: 'Preguntas frecuentes',
        [TypePromptAi.ACTIONS]: 'Acciones',
    };

    const enumKeys = Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[];

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

                                        <GenericDeleteDialog
                                            open={deleteDialogOpen}
                                            setOpen={setDeleteDialogOpen}
                                            itemName="prompt"
                                            itemId={module.id}
                                            mutationFn={() => deletePromptAi(msg.id)}
                                            entityLabel="prompt AI"
                                        />
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
