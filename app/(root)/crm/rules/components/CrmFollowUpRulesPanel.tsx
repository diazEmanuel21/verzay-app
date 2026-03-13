"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Loader2, RotateCcw, Settings2, Sparkles } from "lucide-react";

import {
  getCrmFollowUpRules,
  updateCrmFollowUpRule,
} from "@/actions/crm-follow-up-rule-actions";
import { getCrmPromptRules } from "@/actions/crm-prompt-rule-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CRM_FOLLOW_UP_RULE_DEFAULTS,
  CRM_FOLLOW_UP_RULE_STATUS_ORDER,
  CRM_FOLLOW_UP_WEEKDAY_OPTIONS,
  type CrmFollowUpRuleConfig,
  generateCrmFollowUpTimeOptions,
} from "@/lib/crm-follow-up-rules";
import type { CrmPromptRecordMap } from "@/lib/crm-ai-prompt-rules";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLeadStatusLabel } from "../../dashboard/helpers";
import { CrmLeadFunnelPromptWizard } from "./crm-rules/CrmLeadFunnelPromptWizard";
import { CrmLeadStatusPromptWizard } from "./crm-rules/CrmLeadStatusPromptWizard";

function serializeRules(rules: CrmFollowUpRuleConfig[]) {
  return JSON.stringify(
    rules.map((rule) => ({
      ...rule,
      allowedWeekdays: [...rule.allowedWeekdays].sort((a, b) => a - b),
    }))
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState("followUps");
  const [rulesLoading, setRulesLoading] = useState(false);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [rules, setRules] = useState<CrmFollowUpRuleConfig[]>([]);
  const [initialRules, setInitialRules] = useState<CrmFollowUpRuleConfig[]>([]);
  const [promptRecords, setPromptRecords] = useState<CrmPromptRecordMap | null>(
    null
  );
  const [isSaving, startSavingTransition] = useTransition();
  const timeOptions = useMemo(() => generateCrmFollowUpTimeOptions(), []);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);

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
      setRulesLoading(false);
    }
  }, [userId]);

  const loadPrompts = useCallback(async () => {
    setPromptsLoading(true);

    try {
      const result = await getCrmPromptRules(userId);
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }

      setPromptRecords(result.data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los prompts del CRM."
      );
    } finally {
      setPromptsLoading(false);
    }
  }, [userId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen && rules.length === 0 && !rulesLoading) {
        void loadRules();
      }

      if (nextOpen && !promptRecords && !promptsLoading) {
        void loadPrompts();
      }
    },
    [
      loadPrompts,
      loadRules,
      promptRecords,
      promptsLoading,
      rules.length,
      rulesLoading,
    ]
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

  const followUpsContent = rulesLoading && rules.length === 0 ? (
    <LoadingState label="Cargando reglas de follow-up..." />
  ) : (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
        <Badge variant="outline" className="border-sky-200 text-sky-700">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          IA CRM
        </Badge>
        <span className="text-muted-foreground">
          Zona horaria actual: {timezone || "America/Bogota"}
        </span>
      </div>

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
                  <Label
                    htmlFor={`rule-enabled-${leadStatus}`}
                    className="text-sm"
                  >
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
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Reglas follow-up IA
        </Button>
      </DialogTrigger>

      <DialogContent className="h-[100vh] w-screen max-w-none translate-x-[-50%] translate-y-[-50%] gap-0 rounded-none border-0 p-0">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-b border-border/70 px-6 py-5 text-left">
            <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-sky-200 text-sky-700">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    CRM rules
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Gestor responsive full screen
                  </span>
                </div>
                <DialogTitle>Reglas IA del CRM</DialogTitle>
                <DialogDescription>
                  Administra follow-ups, clasificacion del lead y sintetizador
                  desde un unico workspace para este usuario.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="flex flex-1 flex-row">
              <TabsTrigger
                value="followUps"
              >
                Follow-ups
              </TabsTrigger>
              <TabsTrigger
                value="leadStatus"
              >
                Clasificacion lead
              </TabsTrigger>
              <TabsTrigger
                value="leadFunnel"
              >
                Sintetizador
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="followUps"
            >
              <ScrollArea className="flex-1">
                <div className="px-6 py-6">{followUpsContent}</div>
              </ScrollArea>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 px-6 py-4">
                <Button
                  variant="ghost"
                  onClick={handleResetAll}
                  disabled={!hasChanges || isSaving}
                >
                  Resetear cambios
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || rulesLoading}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Settings2 className="mr-2 h-4 w-4" />
                  )}
                  Guardar reglas
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="leadStatus"
              className="mt-0 min-h-0 flex-1 overflow-hidden"
            >
              {promptsLoading && !promptRecords ? (
                <LoadingState label="Cargando wizard de clasificacion..." />
              ) : promptRecords ? (
                <CrmLeadStatusPromptWizard
                  userId={userId}
                  record={promptRecords.leadStatus}
                  onSaved={(next) =>
                    setPromptRecords((current) =>
                      current
                        ? {
                          ...current,
                          leadStatus: next,
                        }
                        : current
                    )
                  }
                />
              ) : (
                <LoadingState label="Sin configuracion disponible." />
              )}
            </TabsContent>

            <TabsContent
              value="leadFunnel"
              className="mt-0 min-h-0 flex-1 overflow-hidden"
            >
              {promptsLoading && !promptRecords ? (
                <LoadingState label="Cargando wizard del sintetizador..." />
              ) : promptRecords ? (
                <CrmLeadFunnelPromptWizard
                  userId={userId}
                  record={promptRecords.leadFunnel}
                  onSaved={(next) =>
                    setPromptRecords((current) =>
                      current
                        ? {
                          ...current,
                          leadFunnel: next,
                        }
                        : current
                    )
                  }
                />
              ) : (
                <LoadingState label="Sin configuracion disponible." />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
