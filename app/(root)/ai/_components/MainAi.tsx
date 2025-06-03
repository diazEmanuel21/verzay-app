"use client";

import { useState } from "react";
import { FormPromptAiProps, PromptAiFormValues, TYPE_AI_LABELS } from '@/schema/ai';
import { SystemMessage, TypePromptAi } from '@prisma/client';
import { useDebounce } from '@/hooks/useDebounce';
import Header from '@/components/shared/header';
import { Input } from '@/components/ui/input';
import { MessageTabs, PromptDialog } from "./";

export const MainAi = ({ promptAi, userId }: FormPromptAiProps) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [editingData, setEditingData] = useState<PromptAiFormValues | null>(null);
    const [activeTab, setActiveTab] = useState<TypePromptAi>(TypePromptAi.TRAINING);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const openCreateDialog = () => {
        setEditingData({
            title: '',
            message: '',
            userId,
            typePrompt: 'TRAINING'
        });
        setDialogOpen(true);
    };

    const openEditDialog = (msg: SystemMessage) => {
        setEditingData({
            id: msg.id,
            message: msg.message,
            title: msg.title,
            typePrompt: msg.typePrompt ?? 'TRAINING',
            userId: msg.userId
        });
        setDialogOpen(true);
    };

    const filteredMessages = (promptAi ?? []).filter((msg) => {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return (
            msg.title?.toLowerCase().includes(lowerSearch) ||
            msg.message?.toLowerCase().includes(lowerSearch)
        );
    });

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
            ) : (
                part
            )
        );
    };

    const truncateMessage = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "… Ver más";
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-1 mb-4">
                <div className="flex justify-between items-center">
                    <Header title={'Entrena tu IA'} />
                    <button
                        onClick={openCreateDialog}
                        className="bg-primary text-white px-4 py-2 rounded-md"
                    >
                        Crear
                    </button>
                </div>
                {/* SEARCH */}
                <Input
                    placeholder="Buscar mensaje por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                {/* TABS */}
                <div className="flex gap-2 border-b border-border pt-2">
                    {Object.entries(TYPE_AI_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as TypePromptAi)}
                            className={`px-4 py-2 rounded-t-md font-medium text-sm border-b-2 transition-colors duration-150 ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

            </div>

            {/* Scroll interno para el contenido */}
            <div className="flex-1 overflow-y-auto">
                <MessageTabs
                    messages={filteredMessages}
                    debouncedSearchTerm={debouncedSearchTerm}
                    highlightMatch={highlightMatch}
                    truncateMessage={truncateMessage}
                    openEditDialog={openEditDialog}
                    activeTab={activeTab}
                />
            </div>
            {/* Modal reutilizable */}
            <PromptDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                defaultValues={editingData}
                userId={userId}
            />
        </div>
    );
};
