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
import { X, Plus, Trash2 } from "lucide-react";
import {
  DataSubtype,
  ElementItem,
  StepTraining,
  TrainingBuilderProps,
} from "@/types/agentAi";
import { Workflow } from "@prisma/client";
import { useTrainingAutosave, AutosaveStatus } from "./hooks/useTrainingAutosave"; // 👈 import status
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

/* utilidad: type-guard para pedidos */
function isPedidoFn(el: ElementItem): el is PedidoFunctionEl {
  return (
    el.kind === "function" &&
    (el as any).fn === "captura_datos"
    // && (el as any).subtype === "Pedidos"
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
  registerSaveHandler
}: TrainingBuilderProps) {
  const [steps, setSteps] = useState<StepTraining[]>(() => {
    if (Array.isArray(initialSteps) && initialSteps.length > 0) {
      return initialSteps as StepTraining[];
    }
    return [];
  });

  // 🔹 Estado de autosave
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

  // Para compatibilidad con tu API onChange antigua, usamos el primer paso
  const firstStep = steps[0];

  /* -------------------- Construcción del trainingPrompt -------------------- */
  const trainingPrompt = useMemo(() => {
    return buildSectionedPrompt(steps as any, {
      emptyMessage:
        "Aún no has agregado pasos de entrenamiento. Usa “Agregar paso” para comenzar.",
      sectionLabel: (n, step) => `### Paso ${n} — ${step.title || "Sin título"}`,
      elementsLabel: (n) => `Elementos del paso: ${n}`,
      mainMessageLabel: "Objetivo principal del paso\n",
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
              e.id === elId &&
                e.kind === "function" &&
                e.fn === "ejecutar_flujo"
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
            elements: s.elements.map((e) =>
              e.id === elId ? { ...e, subtype } : e
            ),
          }
          : s
      )
    );
  };

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
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <Card key={step.id} className="bg-muted/10 border-muted/60">
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
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
                      onChange={(e) =>
                        updateStepMainMessage(step.id, e.target.value)
                      }
                      placeholder="Escribe el mensaje inicial para este paso…"
                      className="min-h-[32px]"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Elementos del paso
                      </span>
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

                  <div className="rounded-lg border border-dashed border-muted/60 p-1">
                    {step.elements.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground">
                        No hay elementos en este paso. Agrega funciones o textos
                        usando los botones de arriba.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {step.elements.map((el) => (
                          <ElementRenderer
                            key={el.id}
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
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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