"use client";

import { useState } from "react";
import { TypePromptAi, SystemMessage } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { GenericDeleteDialog } from "@/components/shared/GenericDeleteDialog";
import { deletePromptAi } from "@/actions/ai-actions";

interface CustomTabsProps {
    messages: SystemMessage[];
    highlightMatch: (text: string, query: string) => React.ReactNode;
    truncateMessage: (text: string, maxLength: number) => string;
    openEditDialog: (msg: SystemMessage) => void;
    debouncedSearchTerm: string;
    activeTab: TypePromptAi
}


export function MessageTabs({
    messages,
    highlightMatch,
    truncateMessage,
    openEditDialog,
    debouncedSearchTerm,
    activeTab
}: CustomTabsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const filteredByType = messages.filter((msg) => msg.typePrompt === activeTab);

    return (
        <div className="w-full">
            <div className="flex flex-col gap-4 w-full">
                {filteredByType.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay mensajes en esta categoría.</p>
                )}

                {filteredByType.map((msg) => (
                    <Card
                        key={msg.id}
                        className="w-full p-4 flex justify-between items-start border-border"
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

                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <TrashIcon className="h-5 w-5" />
                            </Button>

                            <GenericDeleteDialog
                                open={deleteDialogOpen}
                                setOpen={setDeleteDialogOpen}
                                itemName={msg.title}
                                itemId={msg.id}
                                mutationFn={() => deletePromptAi(msg.id)}
                                entityLabel={msg.title}
                            />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}