"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Loader2, RotateCcw, Settings2, Sparkles } from "lucide-react";

import {
  getCrmFollowUpRules,
  updateCrmFollowUpRule,
} from "@/actions/crm-follow-up-rule-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CRM_FOLLOW_UP_RULE_DEFAULTS,
  CRM_FOLLOW_UP_RULE_STATUS_ORDER,
  CRM_FOLLOW_UP_WEEKDAY_OPTIONS,
  type CrmFollowUpRuleConfig,
  generateCrmFollowUpTimeOptions,
} from "@/lib/crm-follow-up-rules";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLeadStatusLabel } from "../helpers";

function serializeRules(rules: CrmFollowUpRuleConfig[]) {
  return JSON.stringify(
    rules.map((rule) => ({
      ...rule,
      allowedWeekdays: [...rule.allowedWeekdays].sort((a, b) => a - b),
    }))
  );
}

export function CrmFollowUpRulesPanel({
  userId,
  onUpdated,
}: {
  userId: string;
  onUpdated?: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [rules, setRules] = useState<CrmFollowUpRuleConfig[]>([]);
  const [initialRules, setInitialRules] = useState<CrmFollowUpRuleConfig[]>([]);
  const [isSaving, startSavingTransition] = useTransition();
  const timeOptions = useMemo(() => generateCrmFollowUpTimeOptions(), []);

  const loadRules = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getCrmFollowUpRules(userId);
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }

      setTimezone(result.data.timezone);
      setRules(result.data.rules);
      setInitialRules(result.data.rules);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las reglas de follow-up."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen && rules.length === 0 && !loading) {
        void loadRules();
      }
    },
    [loadRules, loading, rules.length]
  );

  const patchRule = useCallback(
    (
      leadStatus: CrmFollowUpRuleConfig["leadStatus"],
      patch: Partial<CrmFollowUpRuleConfig>
    ) => {
      setRules((current) =>
        current.map((rule) =>
          rule.leadStatus === leadStatus
            ? {
                ...rule,
                ...patch,
              }
            : rule
        )
      );
    },
    []
  );

  const toggleWeekday = useCallback(
    (leadStatus: CrmFollowUpRuleConfig["leadStatus"], weekday: number) => {
      setRules((current) =>
        current.map((rule) => {
          if (rule.leadStatus !== leadStatus) return rule;

          const nextWeekdays = rule.allowedWeekdays.includes(weekday)
            ? rule.allowedWeekdays.filter((item) => item !== weekday)
            : [...rule.allowedWeekdays, weekday].sort((a, b) => a - b);

          return {
            ...rule,
            allowedWeekdays: nextWeekdays,
          };
        })
      );
    },
    []
  );

  const resetRuleToDefault = useCallback(
    (leadStatus: CrmFollowUpRuleConfig["leadStatus"]) => {
      setRules((current) =>
        current.map((rule) =>
          rule.leadStatus === leadStatus
            ? {
                ...rule,
                ...CRM_FOLLOW_UP_RULE_DEFAULTS[leadStatus],
              }
            : rule
        )
      );
    },
    []
  );

  const hasChanges = useMemo(
    () => serializeRules(rules) !== serializeRules(initialRules),
    [initialRules, rules]
  );

  const handleResetAll = useCallback(() => {
    setRules(initialRules);
  }, [initialRules]);

  const handleSave = useCallback(() => {
    const dirtyRules = rules.filter((rule, index) => {
      const baseline = initialRules[index];
      return JSON.stringify(rule) !== JSON.stringify(baseline);
    });

    if (dirtyRules.length === 0) {
      toast.message("No hay cambios pendientes.");
      return;
    }

    startSavingTransition(async () => {
      for (const rule of dirtyRules) {
        const result = await updateCrmFollowUpRule({
          userId,
          leadStatus: rule.leadStatus,
          enabled: rule.enabled,
          delayMinutes: rule.delayMinutes,
          maxAttempts: rule.maxAttempts,
          goal: rule.goal,
          prompt: rule.prompt,
          fallbackMessage: rule.fallbackMessage,
          allowedWeekdays: rule.allowedWeekdays,
          sendStartTime: rule.sendStartTime,
          sendEndTime: rule.sendEndTime,
        });

        if (!result.success || !result.data) {
          toast.error(result.message);
          return;
        }
      }

      await loadRules();
      await onUpdated?.();
      toast.success("Reglas de follow-up actualizadas.");
    });
  }, [initialRules, loadRules, onUpdated, rules, userId]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Reglas follow-up IA
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Follow-up IA del CRM</SheetTitle>
          <SheetDescription>
            Configura una sola cola inteligente por estado del lead. La IA usa el
            resumen del CRM y solo envia dentro de los dias y horarios que definas.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
            <Badge variant="outline" className="border-sky-200 text-sky-700">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              IA CRM
            </Badge>
            <span className="text-muted-foreground">
              Zona horaria actual: {timezone || "America/Bogota"}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {CRM_FOLLOW_UP_RULE_STATUS_ORDER.map((leadStatus) => {
                const rule = rules.find((item) => item.leadStatus === leadStatus);
                if (!rule) return null;

                return (
                  <Card key={leadStatus} className="border-border/70">
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {getLeadStatusLabel(leadStatus)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {leadStatus === "FINALIZADO" || leadStatus === "DESCARTADO"
                              ? "Estados de cierre: por defecto no generan nuevos follow-ups."
                              : "El mensaje se programa despues del delay y se mueve a la siguiente ventana habilitada."}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Label htmlFor={`rule-enabled-${leadStatus}`} className="text-sm">
                            Activa
                          </Label>
                          <Switch
                            id={`rule-enabled-${leadStatus}`}
                            checked={rule.enabled}
                            onCheckedChange={(checked) =>
                              patchRule(leadStatus, { enabled: checked })
                            }
                          />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                          <Label>Delay base (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={43200}
                            value={rule.delayMinutes}
                            disabled={!rule.enabled}
                            onChange={(event) =>
                              patchRule(leadStatus, {
                                delayMinutes: Math.max(
                                  Number(event.target.value || 0),
                                  0
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Max intentos</Label>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={rule.maxAttempts}
                            disabled={!rule.enabled}
                            onChange={(event) =>
                              patchRule(leadStatus, {
                                maxAttempts: Math.max(
                                  Number(event.target.value || 0),
                                  0
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Desde</Label>
                          <Select
                            value={rule.sendStartTime}
                            disabled={!rule.enabled}
                            onValueChange={(value) =>
                              patchRule(leadStatus, { sendStartTime: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Hora inicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Hasta</Label>
                          <Select
                            value={rule.sendEndTime}
                            disabled={!rule.enabled}
                            onValueChange={(value) =>
                              patchRule(leadStatus, { sendEndTime: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Hora fin" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Dias habilitados</Label>
                        <div className="flex flex-wrap gap-2">
                          {CRM_FOLLOW_UP_WEEKDAY_OPTIONS.map((option) => {
                            const selected = rule.allowedWeekdays.includes(option.value);

                            return (
                              <button
                                key={`${leadStatus}-${option.value}`}
                                type="button"
                                disabled={!rule.enabled}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-sm transition-colors",
                                  selected
                                    ? "border-sky-300 bg-sky-50 text-sky-700"
                                    : "border-border bg-background text-muted-foreground",
                                  !rule.enabled && "cursor-not-allowed opacity-60"
                                )}
                                onClick={() => toggleWeekday(leadStatus, option.value)}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-3">
                        <div className="space-y-2 xl:col-span-1">
                          <Label>Objetivo</Label>
                          <Textarea
                            rows={4}
                            disabled={!rule.enabled}
                            value={rule.goal}
                            onChange={(event) =>
                              patchRule(leadStatus, { goal: event.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2 xl:col-span-1">
                          <Label>Prompt interno</Label>
                          <Textarea
                            rows={4}
                            disabled={!rule.enabled}
                            value={rule.prompt}
                            onChange={(event) =>
                              patchRule(leadStatus, { prompt: event.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2 xl:col-span-1">
                          <Label>Mensaje fallback</Label>
                          <Textarea
                            rows={4}
                            disabled={!rule.enabled}
                            value={rule.fallbackMessage}
                            onChange={(event) =>
                              patchRule(leadStatus, {
                                fallbackMessage: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetRuleToDefault(leadStatus)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar defaults
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={handleResetAll} disabled={!hasChanges || isSaving}>
              Resetear cambios
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving || loading}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings2 className="mr-2 h-4 w-4" />
              )}
              Guardar reglas
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
