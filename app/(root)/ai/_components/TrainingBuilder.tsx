"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, GripVertical } from "lucide-react";

import {
  DataSubtype,
  ElementItem,
  StepTraining,
  TrainingBuilderProps,
} from "@/types/agentAi";
import { Workflow } from "@prisma/client";
import { useTrainingAutosave, AutosaveStatus } from "./hooks/useTrainingAutosave";
import { PedidoFunctionEl } from "../../../../types/agentAi";
import { FunctionSelector } from "./";
import ElementRenderer from "./action-steeps/ElementRenderer";
import { buildSectionedPrompt } from "./helpers";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const WELCOME_TITLE = "Inicio Bienvenida";

/* utilidad: type-guard para pedidos */
function isPedidoFn(el: ElementItem): el is PedidoFunctionEl {
  return (
    el.kind === "function" &&
    (el as any).fn === "captura_datos"
  );
}

/** -------------------- Sortables -------------------- */

function SortableStepCard({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (args: { dragHandleProps: any; isDragging: boolean }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    data: { type: "step" },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}

function SortableElementRow({
  id,
  stepId,
  children,
}: {
  id: string;
  stepId: string;
  children: (args: { dragHandleProps: any; isDragging: boolean }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "element", stepId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}

export function TrainingBuilder({
  flows = [],
  notificationNumber,
  onChange,
  values,
  handleChange,
  promptId,
  version,
  onVersionChange,
  initialSteps = [],
  registerSaveHandler,
}: TrainingBuilderProps) {
  const [steps, setSteps] = useState<StepTraining[]>(() => {
    if (Array.isArray(initialSteps) && initialSteps.length > 0) {
      return initialSteps as StepTraining[];
    }
    return [];
  });

  // estado de autosave
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");

  const handleConflict = useCallback(
    (serverState: any) => {
      const serverSteps = serverState?.sections?.training?.steps ?? [];
      setSteps(serverSteps);
    },
    [setSteps]
  );

  const { forceSave } = useTrainingAutosave({
    promptId,
    version,
    steps,
    onVersionChange,
    onConflict: handleConflict,
    onStatusChange: setAutosaveStatus,
    mode: "manual",
  });

  useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(forceSave);
  }, [registerSaveHandler, forceSave]);

  // Reset visual de "Cambios guardados" después de un rato
  useEffect(() => {
    if (autosaveStatus === "saved") {
      const t = setTimeout(() => setAutosaveStatus("idle"), 1500);
      return () => clearTimeout(t);
    }
  }, [autosaveStatus]);

  const firstStep = steps[0];

  /* -------------------- Construcción del trainingPrompt -------------------- */
  const trainingPrompt = useMemo(() => {
    return buildSectionedPrompt(steps as any, {
      emptyMessage:
        "Aún no has agregado pasos de entrenamiento. Usa “Agregar paso” para comenzar.",
      sectionLabel: (n, step) => `### Paso ${n} — ${step.title || "Sin título"}`,
      elementsLabel: (n) => `#### Elementos del paso: ${n}`,
      mainMessageLabel: "Objetivo/respuesta principal del paso:",
      joinSeparator: "\n",
    });
  }, [steps]);

  /* --------- Propagar cambios: onChange (compat) + values.training --------- */
  useEffect(() => {
    if (firstStep) {
      onChange?.({
        mainMessage: firstStep.mainMessage ?? "",
        elements: firstStep.elements,
      });
    }

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
    if (steps.length === 0) {
      setSteps((prev) => [
        ...prev,
        {
          id: nanoid(),
          title: WELCOME_TITLE,
          mainMessage: `Al iniciar un chat, la *Prioridad:* es analizar si el *chat es nuevo* para seguir el *orden exacto* definido, *sin omitir ninguna*. en WhatsApp para recopilar información clave antes de atender otras consultas.\n\nCuando un *Usuario:* inicie la conversación con frases como:\n> Hola / Buenos días / Buenas tardes / Buenas noches / Información / Precio / Me interesa / Etc.\n* *Enviar mensaje de Bienvenida:*\nTu único mensaje de bienvenida es:`,
          // mainMessage: `Cuando un **Usuario:** inicie la conversación con frases como:\n\n\> Hola / Buenos días / Buenas tardes / Buenas noches/Información / Precio / Me interesa / Etc. (Que no tenga un contexto claro)\n\n***Enviar mensaje de Bienvenida:**\n\nTu único mensaje de bienvenida es:`,
          elements: [
            {
              id: nanoid(),
              kind: "text",
              text: "",
            },
          ],
          openPicker: false,
        },
      ]);
      return;
    }

    setSteps((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: ``,
        mainMessage: "",
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
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, mainMessage } : s))
    );
  };

  const removeElement = (stepId: string, elId: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, elements: s.elements.filter((e) => e.id !== elId) }
          : s
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

  const onSubtypeChange = (stepId: string, elId: string, subtype: DataSubtype) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
            ...s,
            elements: s.elements.map((e) => (e.id === elId ? { ...e, subtype } : e)),
          }
          : s
      )
    );
  };

  /** -------------------- dnd-kit config -------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stepIds = useMemo(() => steps.map((s) => s.id), [steps]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeType = active.data.current?.type;

      // 1) Reordenar pasos
      if (activeType === "step") {
        if (active.id === over.id) return;
        setSteps((prev) => {
          const oldIndex = prev.findIndex((s) => s.id === active.id);
          const newIndex = prev.findIndex((s) => s.id === over.id);
          if (oldIndex < 0 || newIndex < 0) return prev;
          return arrayMove(prev, oldIndex, newIndex);
        });
        return;
      }

      // 2) Reordenar elementos dentro del mismo paso
      if (activeType === "element") {
        const activeStepId = active.data.current?.stepId as string | undefined;
        const overStepId = over.data.current?.stepId as string | undefined;

        // Solo reordenamos si están dentro del mismo step (mínimo cambio / sin mover entre pasos)
        if (!activeStepId || !overStepId || activeStepId !== overStepId) return;
        if (active.id === over.id) return;

        setSteps((prev) =>
          prev.map((s) => {
            if (s.id !== activeStepId) return s;
            const oldIndex = s.elements.findIndex((e) => e.id === active.id);
            const newIndex = s.elements.findIndex((e) => e.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return s;
            return { ...s, elements: arrayMove(s.elements, oldIndex, newIndex) };
          })
        );
      }
    },
    [setSteps]
  );

  /* --------------------------------- UI --------------------------------- */
  return (
    <Card className="border-muted/60">
      <CardHeader className="pb-2 flex items-center justify-between gap-2 flex-row">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Entrenamiento</CardTitle>

          {/* 🔹 Indicador de autosave */}
          {autosaveStatus !== "idle" && (
            <span
              className={
                "text-xs " +
                (autosaveStatus === "saving"
                  ? "text-muted-foreground"
                  : autosaveStatus === "saved"
                    ? "text-emerald-500"
                    : autosaveStatus === "error"
                      ? "text-destructive"
                      : "")
              }
            >
              {autosaveStatus === "saving" && "Guardando..."}
              {autosaveStatus === "saved" && "Cambios guardados"}
              {autosaveStatus === "error" && "Error al guardar"}
            </span>
          )}
        </div>

        {steps.length < 1 && (
          <Button size="sm" onClick={addStep} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar paso
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {steps.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            No has creado pasos. Crea tu primer paso con “Agregar paso”.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const lockWelcome = step.title === WELCOME_TITLE; // bloquea drag del welcome (opcional)

                  return (
                    <SortableStepCard
                      key={step.id}
                      id={step.id}
                      disabled={lockWelcome}
                    >
                      {({ dragHandleProps }) => (
                        <Card className="bg-muted/10 border-muted/60">
                          <CardHeader className="py-3">
                            <div className="flex items-start gap-2">
                              {/* Drag handle del paso */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-6 h-8 w-8 cursor-grab active:cursor-grabbing"
                                title={lockWelcome ? "Paso fijo" : "Arrastrar paso"}
                                disabled={lockWelcome}
                                {...dragHandleProps}
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>

                              <div className="grid w-full max-w-sm items-center gap-3">
                                <Label htmlFor={step.id}>{`Paso ${idx + 1}`}</Label>
                                <Input
                                  id={step.id}
                                  value={step.title}
                                  onChange={(e) => updateStepTitle(step.id, e.target.value)}
                                  className="h-8"
                                  placeholder="Título del paso"
                                />
                              </div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Eliminar Pregunta"
                                    className="ml-auto"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar entrenamiento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Seguro que quieres eliminar este entrenamiento? Esta
                                      acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => removeStep(step.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">{`Objetivo principal del paso ${idx + 1
                                }`}</label>
                              <Textarea
                                value={step.mainMessage}
                                onChange={(e) => updateStepMainMessage(step.id, e.target.value)}
                                placeholder="Escribe el mensaje inicial para este paso…"
                                className="min-h-[32px]"
                                disabled={step.title === WELCOME_TITLE}
                              />
                            </div>

                            <Separator />

                            <div className="rounded-lg border border-dashed border-muted/60 p-1">
                              {step.elements.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground">
                                  No hay elementos en este paso. Agrega funciones o textos
                                  usando los botones de arriba.
                                </div>
                              ) : (
                                <SortableContext
                                  items={step.elements.map((e) => e.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-3">
                                    {step.elements.map((el) => (
                                      <SortableElementRow key={el.id} id={el.id} stepId={step.id}>
                                        {({ dragHandleProps }) => (
                                          <div className="flex items-start gap-2">
                                            {/* Drag handle del elemento */}
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 mt-2 cursor-grab active:cursor-grabbing"
                                              title="Arrastrar elemento"
                                              {...dragHandleProps}
                                            >
                                              <GripVertical className="h-4 w-4" />
                                            </Button>

                                            <div className="flex-1">
                                              <ElementRenderer
                                                stepId={step.id}
                                                el={el}
                                                flows={flows}
                                                removeElement={removeElement}
                                                updateText={updateText}
                                                setFlowOnElement={setFlowOnElement}
                                                addPedidoField={addPedidoField}
                                                removePedidoField={removePedidoField}
                                                onSubtypeChange={onSubtypeChange}
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </SortableElementRow>
                                    ))}
                                  </div>
                                </SortableContext>
                              )}
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Elementos del paso</span>
                                <Badge variant="secondary">{idx + 1}</Badge>
                              </div>
                              <div className="flex gap-2">
                                <FunctionSelector
                                  step={step}
                                  setSteps={setSteps}
                                  notificationNumber={notificationNumber ?? ""}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </SortableStepCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {steps.length > 0 && (
        <CardFooter className="pb-2 flex items-center justify-between gap-2 flex-row">
          <CardTitle className="text-base">Entrenamiento</CardTitle>

          <Button size="sm" onClick={addStep} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar paso
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}