import { Button } from "@/components/ui/button";
import { TypePromptAi } from "@prisma/client";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InterfaceAiCreatePrompt } from "@/schema/ai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AiCreatePrompt = ({
    loading,
    dialogOpen,
    title,
    message,
    editingId,
    setDialogOpen,
    setEditingId,
    setTitle,
    setMessage,
    type,
    setType,
    handleSubmit
}: InterfaceAiCreatePrompt) => {
    const TYPE_LABELS: Record<TypePromptAi, string> = {
        [TypePromptAi.TRAINING]: 'Entrenamiento',
        [TypePromptAi.FAQs]: 'Preguntas frecuentes',
        [TypePromptAi.ACTIONS]: 'Acciones',
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    className="font-bold uppercase"
                    onClick={() => {
                        setEditingId(null);
                        setTitle("");
                        setMessage("");
                        setType(TypePromptAi.TRAINING) // Valor por defecto
                    }}
                >
                    Agregar
                </Button>
            </DialogTrigger>

            <DialogContent
                className="max-w-4xl h-[600px] flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()} // ← evita scroll al abrir
            >
                <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Mensaje" : "Nuevo Mensaje"}</DialogTitle>
                    <DialogDescription>
                        Completa los campos para personalizar tu IA
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            maxLength={100}
                            placeholder="Ejemplo: Bienvenida"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <Label htmlFor="message">Descripción</Label>
                        <Textarea
                            id="message"
                            placeholder="Ejemplo: Saluda cordialmente al usuario y ofrece ayuda."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 resize-none overflow-y-auto"
                        />
                    </div>


                    <div className="flex flex-col gap-2">
                        <Label>Categoría</Label>
                        <Select value={type} onValueChange={(val: TypePromptAi) => setType(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(TypePromptAi).map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {TYPE_LABELS[cat]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
