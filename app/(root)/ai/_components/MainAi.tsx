"use client";

import Header from '@/components/shared/header';
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
    agregarMensaje,
    getPromptAi,
    editarMensaje,
    eliminarMensaje,
} from "@/actions/api-action";

import { Skeleton } from '../../../../components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { AiCreatePrompt, MessageTabs } from './';
import { FormPromptAiProps, PromptAi } from '@/schema/ai';
import { TypePromptAi } from '@prisma/client';

function MessagesSkeleton() {
    return (
        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
        </div>
    );
};

export const MainAi = ({ userId }: FormPromptAiProps) => {
    const [messages, setMessages] = useState<PromptAi[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [typeAiPrompt, setTypeAiPrompt] = useState<TypePromptAi>("TRAINING");

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        loadMessages();
    }, [userId]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const userMessages = await getPromptAi(userId);
            setMessages(userMessages);
        } catch (error) {
            toast.error("Error al cargar los mensajes.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("title", title.toUpperCase());
        formData.append("message", message);
        formData.append("typePrompt", typeAiPrompt);
        formData.append("userId", userId);

        try {
            let result;

            if (editingId) {
                formData.append("id", editingId);
                result = await editarMensaje(formData);
            } else {
                result = await agregarMensaje(formData);
            }

            if (result.success) {
                toast.success(result.message);
                setTitle("");
                setMessage("");
                setEditingId(null);
                setDialogOpen(false);
                loadMessages();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Hubo un error al procesar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (msg: PromptAi) => {
        setTitle((msg.title)?.toUpperCase() ?? '');
        setMessage(msg.message ?? '');
        setEditingId(msg.id);
        setDialogOpen(true);
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
        handleDelete();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);

        try {
            const result = await eliminarMensaje(deleteId);
            if (result.success) {
                toast.success(result.message);
                loadMessages();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al eliminar el mensaje");
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const filteredMessages = messages.filter((msg) => {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return (
            (msg.title?.toLowerCase().includes(lowerSearch) ?? false) ||
            (msg.message?.toLowerCase().includes(lowerSearch) ?? false)
        );
    });

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 font-semibold">
                    {part}
                </span>
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
            {/* Header fijo */}
            <div className="sticky top-0 z-1 mb-6">
                <div className="flex justify-between items-center">
                    <Header
                        title={'Entrena tu IA'}
                    />
                    <AiCreatePrompt
                        loading={loading}
                        dialogOpen={dialogOpen}
                        editingId={editingId}
                        title={title}
                        type={typeAiPrompt}
                        message={message}
                        setDialogOpen={() => setDialogOpen(!dialogOpen)}
                        setEditingId={() => setEditingId(null)}
                        setTitle={(value: string) => setTitle(value)}
                        setMessage={(value: string) => setMessage(value)}
                        setType={setTypeAiPrompt}
                        handleSubmit={handleSubmit}
                    />
                </div>
                <Input
                    placeholder="Buscar mensaje por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Cards Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <MessagesSkeleton />
                    ) : messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aún no hay mensajes configurados.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <MessageTabs
                                messages={filteredMessages}
                                debouncedSearchTerm={debouncedSearchTerm}
                                highlightMatch={highlightMatch}
                                truncateMessage={truncateMessage}
                                openEditDialog={openEditDialog}
                                confirmDelete={confirmDelete}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}