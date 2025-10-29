"use client";

import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, PenSquare } from "lucide-react";
import { useExtrasAutosave } from "./hooks/useExtrasAutosave";
import { ExtraInfoBuilderProps, ExtraItemDTO } from "@/types/agentAi";
import { FunctionSelectorInline, previewText } from "./helpers";

const PROMPT_SIGNATURE_DEFAULT =
    "###  FIRMA DEL AGENTE\n\n" +
    "Debes poner siempre la firma *“*@signature_name”* al inicio de cada mensaje o respuesta que le des al usuario, **nunca al final*. Esto permite mantener una identidad clara del agente y una conversación ordenada.\n\n" +
    "### Ejemplo de uso real:\n\n" +
    "*Usuario:*\n" +
    "¿Quien eres?\n\n" +
    "*Respuesta del agente:*\n" +
    "@signature_name\n" +
    "Soy un asistente virtual. ¿En qué puedo ayudarte hoy?";

export function ExtraInfoBuilder({
    values,
    handleChange,
    onChange,
    promptId,
    version,
    onVersionChange,
    onConflict,
    initialExtras,
    flows = [],
    notificationNumber
}: ExtraInfoBuilderProps & { flows?: { id: string; name: string }[] }) {
    // Obtener la firma actual o la default
    const userSignaturePrompt =
        initialExtras?.firmaText === ""
            ? PROMPT_SIGNATURE_DEFAULT
            : initialExtras?.firmaText ?? PROMPT_SIGNATURE_DEFAULT;

    const [items, setItems] = useState<ExtraItemDTO[]>(
        initialExtras?.items && initialExtras.items.length > 0
            ? initialExtras.items
            : [{ id: nanoid(), title: "", content: "" }]
    );

    const [firmaEnabled, setFirmaEnabled] = useState<boolean>(
        initialExtras?.firmaEnabled ?? false
    );

    // 🧩 Extraer el nombre actual de la firma
    const match = userSignaturePrompt.match(/@([a-zA-Z0-9_]+)/);
    debugger;
    const initialSignatureName = match ? match[1] : initialExtras?.firmaName ?? 'Asistente virtual';

    const [signatureName, setSignatureName] =
        useState<string>(initialSignatureName);

    // Generar el texto final de la firma
    const firmaText = useMemo(() => {
        return PROMPT_SIGNATURE_DEFAULT.replaceAll("@signature_name", signatureName);
    }, [signatureName]);

    // AUTOSAVE
    useExtrasAutosave({
        promptId,
        version,
        items,
        firmaEnabled,
        firmaText,
        firmaName: signatureName,
        onVersionChange,
        onConflict: (serverState) => {
            const s = serverState?.sections?.extras ?? {};
            setItems(s.items ?? []);
            setFirmaEnabled(Boolean(s.firmaEnabled));

            const savedText = s.firmaText ?? PROMPT_SIGNATURE_DEFAULT;
            const m = savedText.match(/@([a-zA-Z0-9_]+)/);
            setSignatureName(m ? m[1] : initialExtras?.firmaName ?? "Asistente virtual");

            onConflict?.(serverState);
        },
    });

    // Construir preview
    const prompt = useMemo(() => {
        const extraBlocks = items
            .filter((e) => (e.title ?? "").trim() || (e.content ?? "").trim())
            .map((e) =>
                [
                    `### Campo: ${(e.title ?? "").trim() || "(Sin título)"}`,
                    `* **Contenido:**`,
                    (e.content ?? "").trim() || "(Sin contenido)",
                ].join("\n")
            );

        const parts: string[] = [];
        if (firmaEnabled) parts.push(firmaText.trim());
        if (extraBlocks.length) parts.push(extraBlocks.join("\n\n---\n\n"));
        return parts.join("\n\n---\n\n");
    }, [items, firmaEnabled, firmaText]);

    // Sincronizar con el padre
    useEffect(() => {
        onChange?.({ items: items as ExtraItemDTO[], firmaEnabled, firmaText, firmaName: signatureName, prompt });
        if (values.more !== prompt) {
            const setMore = handleChange("more");
            setMore({
                target: { value: prompt },
            } as React.ChangeEvent<HTMLTextAreaElement>);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompt, items, firmaEnabled, firmaText, values.more]);

    // Mutadores
    const addItem = () =>
        setItems((p) => [...p, { id: nanoid(), title: "", content: "" }]);
    const removeItem = (id: string) =>
        setItems((p) => p.filter((x) => x.id !== id));
    const updateTitle = (id: string, v: string) =>
        setItems((p) => p.map((x) => (x.id === id ? { ...x, title: v } : x)));
    const updateContent = (id: string, v: string) =>
        setItems((p) => p.map((x) => (x.id === id ? { ...x, content: v } : x)));

    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    Campos / Información extra + Firma
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Firma */}
                <div className="rounded-md border p-2 border-muted/60 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            Firma del agente (solo editable el nombre)
                        </span>
                        {firmaEnabled ? (
                            <Button variant="ghost" onClick={() => setFirmaEnabled(false)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        ) : (
                            <Button variant="secondary" onClick={() => setFirmaEnabled(true)}>
                                <PenSquare className="h-4 w-4 mr-2" />
                                Agregar &quot;firma&quot;
                            </Button>
                        )}
                    </div>

                    {firmaEnabled && (
                        <>
                            <label className="text-sm">Nombre en la firma</label>
                            <Input
                                placeholder="Ej. Asistente Virtual"
                                value={signatureName}
                                onChange={(e) => setSignatureName(e.target.value)}
                            />
                            {/* <p className="text-xs text-muted-foreground">
                                Solo puedes modificar el nombre de la firma. El resto del texto
                                es fijo.
                            </p> */}

                            <Textarea
                                className="min-h-[32px] text-xs opacity-80 hidden"
                                readOnly
                                value={firmaText}
                            />
                        </>
                    )}
                </div>

                {/* Items extra */}
                <div className="space-y-3">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="rounded-md border border-muted/60 p-2 space-y-2"
                        >
                            {/* Header compacto (nombre) */}
                            <div className="flex items-start justify-between gap-2">
                                <pre className="text-[13px] leading-snug whitespace-pre-wrap break-words font-medium text-foreground/90">
                                    {it.title || "sin titulo"}
                                </pre>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Eliminar producto"
                                    onClick={() => removeItem(it.id)}
                                    className="shrink-0 h-7 w-7"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Descripción compacta (truncada) */}
                            <pre className="text-xs leading-snug whitespace-pre-wrap break-words text-foreground/80">
                                {previewText(it.content, 80)}
                            </pre>
                        </div>
                    ))}

                    <div className="flex w-full flex-col">
                        <FunctionSelectorInline<ExtraItemDTO>
                            mode="extras"
                            items={items}
                            addItem={(it) => setItems((prev) => [...prev, it])}
                            flows={flows}
                            notificationNumber={notificationNumber}
                        />

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}