"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { X, Plus, FileText, Zap, Trash2 } from "lucide-react";
import {
  CAPTURE_SNIPPETS,
  CONSULTA_DATOS_SNIPPET,
  ElementFunction,
  ElementItem,
  ElementText,
  StepTraining,
  TrainingBuilderProps,
} from "@/types/agentAi";
import { Workflow } from "@prisma/client";
import { useTrainingAutosave } from "./hooks/useTrainingAutosave";
import { PedidoFunctionEl } from '../../../../types/agentAi';


/* utilidad: type-guard para pedidos */
function isPedidoFn(el: ElementItem): el is PedidoFunctionEl {
  return (
    el.kind === "function" &&
    (el as any).fn === "captura_datos" &&
    (el as any).subtype === "Pedidos"
  );
}

export function TrainingBuilder({
  flows = [],
  notificationNumber = null,
  onChange,
  values,
  handleChange,

  // NUEVO:
  promptId,
  version,
  onVersionChange,
  onConflict,
  initialSteps = [],
}: TrainingBuilderProps) {
  const [steps, setSteps] = useState<StepTraining[]>(() => {
    // Hidrata desde BD si hay datos; si no, arranca vacío
    if (Array.isArray(initialSteps) && initialSteps.length > 0) {
      return initialSteps as StepTraining[];
    }
    return [];
  });

  const handleConflict = useCallback((serverState: any) => {
    const serverSteps = serverState?.sections?.training?.steps ?? [];
    setSteps(serverSteps);
    // si quieres hacer algo más aquí…
  }, [setSteps]);

  // 🔁 AUTOSAVE con debounce (guarda { steps } en sections.training)
  useTrainingAutosave({
    promptId,
    version,
    steps,
    onVersionChange,
    onConflict: handleConflict,
  });

  // Para compatibilidad con tu API onChange antigua, usamos el primer paso
  const firstStep = steps[0];

  /* -------------------- Construcción del trainingPrompt -------------------- */
  const trainingPrompt = useMemo(() => {
    const lines: string[] = [];

    if (steps.length === 0) {
      // Mensaje de ayuda si aún no agregan pasos
      return "Aún no has agregado pasos de entrenamiento. Usa “Agregar paso” para comenzar.";
    }

    steps.forEach((step, i) => {
      const n = i + 1;
      lines.push(`\n# Paso ${n} — ${step.title || "Sin título"}`);
      if (step.mainMessage?.trim()) {
        lines.push(`Mensaje principal del paso:\n${step.mainMessage.trim()}`);
      }

      if (step.elements.length > 0) {
        lines.push("\nElementos del paso:");
        step.elements.forEach((el, idx) => {
          const k = idx + 1;
          if (el.kind === "text") {
            const t = el.text?.trim();
            if (t) lines.push(`- (${k}) Texto: ${t}`);
            return;
          }
          if (el.kind === "function") {
            if (el.fn === "captura_datos") {
              const base = `- (${k}) Captura de datos — ${el.subtype}: ${el.prompt}`;
              lines.push(base);
              if ((el as any).subtype === "Pedidos") {
                const fields = (el as any).fields as string[] | undefined;
                if (fields && fields.length > 0) {
                  lines.push(`  Campos: ${fields.join(", ")}`);
                }
              }
              return;
            }
            if (el.fn === "ejecutar_flujo") {
              lines.push(`- (${k}) Ejecutar flujo: ${el.flowName ?? "—"}`);
              return;
            }
            if (el.fn === "notificar_asesor") {
              lines.push(`- (${k}) Notificar asesor: ${el.notificationNumber ?? "—"}`);
              return;
            }
            if (el.fn === "consulta_datos") {
              lines.push(`- (${k}) Consulta de datos:\n${el.prompt}`);
              return;
            }
          }
        });
      }
    });

    return lines.join("\n");
  }, [steps]);

  /* --------- Propagar cambios: onChange (compat) + values.training --------- */
  useEffect(() => {
    // Compatibilidad: emite el primer paso si existe
    if (firstStep) onChange?.({ mainMessage: firstStep.mainMessage ?? '', elements: firstStep.elements });

    // Actualiza values.training en el padre usando tu handleChange
    if (values.training !== trainingPrompt) {
      const setTraining = handleChange("training");
      setTraining({
        target: { value: trainingPrompt },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingPrompt, onChange]);

  /* -------------------- Acciones por PASO -------------------- */
  const addStep = () => {
    const nextIndex = steps.length + 1;
    setSteps((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: `Paso ${nextIndex}`,
        mainMessage: "Saluda al cliente y pregúntale si desea retirar en tienda o envío a domicilio",
        elements: [],
        openPicker: false,
      },
    ]);
  };

  const removeStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const updateStepTitle = (stepId: string, title: string) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, title } : s)));
  };

  const updateStepMainMessage = (stepId: string, mainMessage: string) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, mainMessage } : s)));
  };

  const toggleStepPicker = (stepId: string, open: boolean) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, openPicker: open } : s)));
  };

  /* -------------------- Elementos dentro de un paso -------------------- */
  const addText = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, elements: [...s.elements, { id: nanoid(), kind: "text", text: "" } as ElementText] }
          : s
      )
    );
  };

  const addFunctionCaptura = (stepId: string, subtype: "Solicitudes" | "Reclamos" | "Pedidos" | "Reservas") => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const base: ElementFunction = {
          id: nanoid(),
          kind: "function",
          fn: "captura_datos",
          subtype,
          prompt: CAPTURE_SNIPPETS[subtype],
        };
        const el: ElementItem =
          subtype === "Pedidos"
            ? ({ ...base, fields: [] } as PedidoFunctionEl)
            : base;

        return {
          ...s,
          elements: [...s.elements, el],
          openPicker: false,
        };
      })
    );
  };

  const addFunctionEjecutarFlujo = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: [
              ...s.elements,
              {
                id: nanoid(),
                kind: "function",
                fn: "ejecutar_flujo",
                flowId: null,
                flowName: null,
              } as ElementFunction,
            ],
            openPicker: false,
          }
          : s
      )
    );
  };

  const addFunctionNotificar = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: [
              ...s.elements,
              {
                id: nanoid(),
                kind: "function",
                fn: "notificar_asesor",
                notificationNumber: notificationNumber ?? null,
              } as ElementFunction,
            ],
            openPicker: false,
          }
          : s
      )
    );
  };

  const addFunctionConsultaDatos = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: [
              ...s.elements,
              {
                id: nanoid(),
                kind: "function",
                fn: "consulta_datos",
                prompt: CONSULTA_DATOS_SNIPPET,
              } as ElementFunction,
            ],
            openPicker: false,
          }
          : s
      )
    );
  };

  const removeElement = (stepId: string, elId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s
      )
    );
  };

  const updateText = (stepId: string, elId: string, text: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: s.elements.map((e) =>
              e.id === elId && e.kind === "text" ? { ...e, text } : e
            ),
          }
          : s
      )
    );
  };

  const setFlowOnElement = (stepId: string, elId: string, flow: Workflow) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: s.elements.map((e) =>
              e.id === elId && e.kind === "function" && e.fn === "ejecutar_flujo"
                ? { ...e, flowId: flow.id, flowName: flow.name }
                : e
            ),
          }
          : s
      )
    );
  };

  /* ----- Campos personalizados para "Pedidos" dentro de captura_datos ----- */
  const addPedidoField = (stepId: string, elId: string, field: string) => {
    const name = field.trim();
    if (!name) return;

    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          elements: s.elements.map((e) => {
            if (e.id !== elId || !isPedidoFn(e)) return e;
            const next = new Set([...(e.fields ?? []), name]);
            return { ...e, fields: Array.from(next) };
          }),
        };
      })
    );
  };

  const removePedidoField = (stepId: string, elId: string, field: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          elements: s.elements.map((e) => {
            if (e.id !== elId || !isPedidoFn(e)) return e;
            return { ...e, fields: (e.fields ?? []).filter((f) => f !== field) };
          }),
        };
      })
    );
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <Card className="border-muted/60">
      <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
        <CardTitle className="text-base">Entrenamiento</CardTitle>
        <Button size="sm" onClick={addStep} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar paso
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {steps.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            No has creado pasos. Crea tu primer paso con “Agregar paso”.
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <Card key={step.id} className="bg-muted/10 border-muted/60">
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={step.title}
                      onChange={(e) => updateStepTitle(step.id, e.target.value)}
                      className="h-8"
                      placeholder="Título del paso"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                      title="Eliminar paso"
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Mensaje principal del paso (vive dentro del paso) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje principal del paso</label>
                    <Textarea
                      value={step.mainMessage}
                      onChange={(e) => updateStepMainMessage(step.id, e.target.value)}
                      placeholder="Escribe el mensaje inicial para este paso…"
                      className="min-h-[72px]"
                    />
                  </div>

                  <Separator />

                  {/* Header de elementos */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Elementos del paso</span>
                      <Badge variant="secondary">{idx + 1}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Popover open={!!step.openPicker} onOpenChange={(o) => toggleStepPicker(step.id, o)}>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="default" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Agregar Función
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[320px]" align="end">
                          <Command>
                            <CommandInput placeholder="Buscar opción…" />
                            <CommandList>
                              <CommandEmpty>Sin coincidencias…</CommandEmpty>

                              <CommandGroup heading="OPCIÓN #1 · Captura de datos">
                                {(["Solicitudes", "Reclamos", "Pedidos", "Reservas"] as const).map((opt) => (
                                  <CommandItem key={opt} onSelect={() => addFunctionCaptura(step.id, opt)}>
                                    {opt}
                                  </CommandItem>
                                ))}
                              </CommandGroup>

                              <CommandSeparator />

                              <CommandGroup heading="OPCIÓN #2 · Ejecutar flujo">
                                <CommandItem onSelect={() => addFunctionEjecutarFlujo(step.id)}>
                                  Seleccionar flujo desde BD…
                                </CommandItem>
                              </CommandGroup>

                              <CommandSeparator />

                              <CommandGroup heading="OPCIÓN #3 · Notificar asesor">
                                <CommandItem onSelect={() => addFunctionNotificar(step.id)}>
                                  Usar número de notificación del perfil
                                </CommandItem>
                              </CommandGroup>

                              <CommandSeparator />

                              <CommandGroup heading="OPCIÓN #4 · Consulta de datos">
                                <CommandItem onSelect={() => addFunctionConsultaDatos(step.id)}>
                                  Agregar “Consultar Productos”
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <Button size="sm" variant="secondary" className="gap-2" onClick={() => addText(step.id)}>
                        <FileText className="h-4 w-4" />
                        Agregar Texto
                      </Button>
                    </div>
                  </div>

                  {/* Lista de elementos del paso */}
                  <div className="rounded-lg border border-dashed border-muted/60 p-3">
                    {step.elements.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        No hay elementos en este paso. Agrega funciones o textos usando los botones de arriba.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {step.elements.map((el) => {
                          if (el.kind === "text") {
                            return (
                              <Card key={el.id} className="bg-muted/30 border-muted/60">
                                <CardHeader className="py-3 flex-row items-center justify-between">
                                  <CardTitle className="text-sm">Texto adicional</CardTitle>
                                  <Button variant="ghost" size="icon" onClick={() => removeElement(step.id, el.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                <CardContent>
                                  <Textarea
                                    placeholder="Texto adicional para este paso…"
                                    value={el.text}
                                    onChange={(e) => updateText(step.id, el.id, e.target.value)}
                                    className="min-h-[84px]"
                                  />
                                </CardContent>
                              </Card>
                            );
                          }

                          if (el.kind === "function" && el.fn === "captura_datos") {
                            const isPedidos = (el as any).subtype === "Pedidos";
                            return (
                              <Card key={el.id} className="bg-muted/20 border-muted/60">
                                <CardHeader className="py-3 flex-row items-center justify-between">
                                  <CardTitle className="text-sm">
                                    Formularios · Captura de datos — {(el as any).subtype}
                                  </CardTitle>
                                  <Button variant="ghost" size="icon" onClick={() => removeElement(step.id, el.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">Prompt agregado:</label>
                                    <Textarea value={(el as any).prompt} readOnly className="min-h-[80px]" />
                                  </div>

                                  {/* Campos personalizados cuando subtype === "Pedidos" */}
                                  {isPedidos && (
                                    <PedidoFieldsEditor
                                      stepId={step.id}
                                      elId={el.id}
                                      element={el as PedidoFunctionEl}
                                      onAdd={(field) => addPedidoField(step.id, el.id, field)}
                                      onRemove={(field) => removePedidoField(step.id, el.id, field)}
                                    />
                                  )}
                                </CardContent>
                              </Card>
                            );
                          }

                          if (el.kind === "function" && el.fn === "ejecutar_flujo") {
                            return (
                              <Card key={el.id} className="bg-muted/20 border-muted/60">
                                <CardHeader className="py-3 flex-row items-center justify-between">
                                  <CardTitle className="text-sm">Ejecutar flujo</CardTitle>
                                  <Button variant="ghost" size="icon" onClick={() => removeElement(step.id, el.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="text-sm text-muted-foreground">
                                    {flows.length === 0
                                      ? "No hay flujos cargados desde la BD."
                                      : "Selecciona un flujo creado en la BD."}
                                  </div>

                                  {flows.length > 0 && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                          {(el as any).flowName ?? "Elegir flujo…"}
                                          <Plus className="h-4 w-4 opacity-60" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="p-0 w-[320px]">
                                        <Command>
                                          <CommandInput placeholder="Buscar flujo…" />
                                          <CommandList>
                                            <CommandEmpty>Sin resultados…</CommandEmpty>
                                            <CommandGroup>
                                              {flows.map((f) => (
                                                <CommandItem
                                                  key={f.id}
                                                  onSelect={() => setFlowOnElement(step.id, el.id, f)}
                                                >
                                                  {f.name}
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          }

                          if (el.kind === "function" && el.fn === "notificar_asesor") {
                            return (
                              <Card key={el.id} className="bg-muted/20 border-muted/60">
                                <CardHeader className="py-3 flex-row items-center justify-between">
                                  <CardTitle className="text-sm">Notificar asesor</CardTitle>
                                  <Button variant="ghost" size="icon" onClick={() => removeElement(step.id, el.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <label className="text-xs font-medium">Número de notificación (perfil):</label>
                                  <Input value={(el as any).notificationNumber ?? ""} readOnly placeholder="No disponible" />
                                </CardContent>
                              </Card>
                            );
                          }

                          // consulta_datos
                          return (
                            <Card key={el.id} className="bg-muted/20 border-muted/60">
                              <CardHeader className="py-3 flex-row items-center justify-between">
                                <CardTitle className="text-sm">Consulta de datos</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => removeElement(step.id, el.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <label className="text-xs font-medium">Snippet agregado:</label>
                                <Textarea value={(el as any).prompt} readOnly className="min-h-[96px]" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      {steps.length > 1 && <CardFooter className="pb-2 flex items-center justify-between gap-2 flex-row">
        <CardTitle className="text-base">Entrenamiento</CardTitle>

        <Button size="sm" onClick={addStep} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar paso
        </Button>
      </CardFooter>
      }
    </Card>
  );
}

/* ----------------- Editor de campos para "Pedidos" ----------------- */
function PedidoFieldsEditor({
  stepId,
  elId,
  element,
  onAdd,
  onRemove,
}: {
  stepId: string;
  elId: string;
  element: PedidoFunctionEl;
  onAdd: (field: string) => void;
  onRemove: (field: string) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    onAdd(input);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">Campos de pedido (texto plano):</label>
      <div className="flex gap-2">
        <Input
          placeholder="Ej.: cc, name, direccion…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Agregar
        </Button>
      </div>

      {element.fields && element.fields.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {element.fields.map((f) => (
            <Badge key={f} variant="outline" className="gap-1">
              {f}
              <button
                type="button"
                aria-label={`Eliminar ${f}`}
                className="ml-1 opacity-70 hover:opacity-100"
                onClick={() => onRemove(f)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Aún no hay campos agregados.</p>
      )}
    </div>
  );
}