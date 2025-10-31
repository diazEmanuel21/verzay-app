"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandEmpty,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Check } from "lucide-react";

/* ===========================
   Tipos y datos quemados
=========================== */
type ProviderId = "openai" | "anthropic" | "google" | "groq";

type Provider = {
    id: ProviderId;
    label: string;
    models: { id: string; label: string }[];
};

const PROVIDERS: Provider[] = [
    {
        id: "openai",
        label: "OpenAI",
        models: [
            { id: "gpt-4o-mini", label: "gpt-4o-mini" },
            { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
            { id: "o4-mini", label: "o4-mini (preview)" },
        ],
    },
    {
        id: "anthropic",
        label: "Anthropic",
        models: [
            { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
            { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
        ],
    },
    {
        id: "google",
        label: "Google (Gemini)",
        models: [
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
            { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
        ],
    },
    {
        id: "groq",
        label: "Groq",
        models: [
            { id: "llama-3.1-70b", label: "Llama 3.1 70B" },
            { id: "mixtral-8x7b", label: "Mixtral 8x7B" },
        ],
    },
];

/* ===========================
   Zod schema (solo guardamos apiUrl)
=========================== */
const FormSchema = z.object({
    provider: z
        .string({ required_error: "Selecciona un proveedor" })
        .min(1, "Selecciona un proveedor"),
    model: z
        .string({ required_error: "Selecciona un modelo" })
        .min(1, "Selecciona un modelo"),
    apiKey: z
        .string({ required_error: "Ingresa tu API key" })
        .min(10, "La API key es demasiado corta"),
});

type FormValues = z.infer<typeof FormSchema>;

/* ===========================
   Helpers
=========================== */
function maskKey(key?: string) {
    if (!key) return "";
    const visible = 4;
    if (key.length <= visible) return "*".repeat(Math.max(4, key.length));
    return `${"*".repeat(Math.max(4, key.length - visible))}${key.slice(-visible)}`;
}

/* ===========================
   Props del componente
=========================== */
type ApiKeyConfiguratorProps = {
    /** Valor actual de apiUrl (API key cruda) */
    value?: string;
    /** Llamado al guardar (retorna SOLO la API key para apiUrl) */
    onSave?: (apiKey: string) => void;
    /** Deshabilitar interacción */
    disabled?: boolean;
    /** Etiqueta opcional para el input de preview */
    label?: string;
};

/* ===========================
   Componente
=========================== */
export function ApiKeyConfigurator({
    value,
    onSave,
    disabled,
    label = "API key (solo lectura)",
}: ApiKeyConfiguratorProps) {
    const [open, setOpen] = React.useState(false);
    const [providerOpen, setProviderOpen] = React.useState(false);
    const [modelOpen, setModelOpen] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            provider: "openai",
            model: "gpt-4o-mini",
            apiKey: value ?? "",
        },
        mode: "onSubmit",
    });

    const providerValue = form.watch("provider");
    const modelsForProvider =
        PROVIDERS.find((p) => p.id === (providerValue as ProviderId))?.models ?? [];

    // Si cambia provider y el modelo actual no existe, lo vaciamos
    React.useEffect(() => {
        const current = form.getValues("model");
        if (!modelsForProvider.some((m) => m.id === current)) {
            form.setValue("model", "");
        }
    }, [providerValue]); // eslint-disable-line

    const submit = (data: FormValues) => {
        // Solo guardamos la API key → apiUrl
        onSave?.(data.apiKey);
        toast.success("API key actualizada.");
        setOpen(false);
    };

    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">{label}</Label>

            {/* Input de previsualización (no editable) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="relative">
                        <Input
                            readOnly
                            disabled={disabled}
                            value={maskKey(value)}
                            placeholder="No configurada"
                            className={cn(
                                "pr-28 cursor-pointer bg-muted/40 border-border",
                                disabled && "cursor-not-allowed opacity-60"
                            )}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            className="absolute right-1 top-1 h-8"
                            disabled={disabled}
                        >
                            Configurar
                        </Button>
                    </div>
                </DialogTrigger>

                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Configurar clave de proveedor</DialogTitle>
                        <DialogDescription>
                            Selecciona el proveedor y el modelo. Por ahora{" "}
                            <span className="font-medium">solo se guardará la API key</span>{" "}
                            en <code>apiUrl</code>.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={form.handleSubmit(submit)}
                        className="grid gap-4 py-2"
                    >
                        {/* Provider */}
                        <div className="grid gap-2">
                            <Label>Proveedor</Label>
                            <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={providerOpen}
                                        className="justify-between"
                                    >
                                        {form.getValues("provider")
                                            ? PROVIDERS.find((p) => p.id === form.getValues("provider"))
                                                ?.label
                                            : "Selecciona un proveedor"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                                    <Command>
                                        <CommandInput placeholder="Buscar proveedor..." />
                                        <CommandList>
                                            <CommandEmpty>Sin resultados</CommandEmpty>
                                            <CommandGroup>
                                                {PROVIDERS.map((prov) => (
                                                    <CommandItem
                                                        key={prov.id}
                                                        value={prov.id}
                                                        onSelect={(val) => {
                                                            form.setValue("provider", val as ProviderId, {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                            });
                                                            setProviderOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                prov.id === form.getValues("provider")
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {prov.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {form.formState.errors.provider && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.provider.message}
                                </p>
                            )}
                        </div>

                        {/* Model */}
                        <div className="grid gap-2">
                            <Label>Modelo</Label>
                            <Popover open={modelOpen} onOpenChange={setModelOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={modelOpen}
                                        disabled={!providerValue}
                                        className={cn(
                                            "justify-between",
                                            !providerValue && "opacity-60"
                                        )}
                                    >
                                        {form.getValues("model")
                                            ? modelsForProvider.find(
                                                (m) => m.id === form.getValues("model")
                                            )?.label
                                            : "Selecciona un modelo"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                                    <Command>
                                        <CommandInput placeholder="Buscar modelo..." />
                                        <CommandList>
                                            <CommandEmpty>Sin resultados</CommandEmpty>
                                            <CommandGroup>
                                                {modelsForProvider.map((m) => (
                                                    <CommandItem
                                                        key={m.id}
                                                        value={m.id}
                                                        onSelect={(val) => {
                                                            form.setValue("model", val, {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                            });
                                                            setModelOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                m.id === form.getValues("model")
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {m.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {form.formState.errors.model && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.model.message}
                                </p>
                            )}
                        </div>

                        {/* API Key */}
                        <div className="grid gap-2">
                            <Label>API key</Label>
                            <Input
                                type="password"
                                placeholder="sk-********************************"
                                {...form.register("apiKey")}
                                className="bg-background border-border"
                            />
                            {form.formState.errors.apiKey && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.apiKey.message}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Seguridad: solo se almacenará la clave en <code>apiUrl</code>.
                            </p>
                        </div>

                        <DialogFooter className="mt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}