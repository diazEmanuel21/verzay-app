"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  getCrmFollowUpRules,
  updateCrmFollowUpRule,
} from "@/actions/crm-follow-up-rule-actions";
import { getCrmPromptRules } from "@/actions/crm-prompt-rule-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CRM_FOLLOW_UP_RULE_DEFAULTS,
  type CrmFollowUpRuleConfig,
  generateCrmFollowUpTimeOptions,
} from "@/lib/crm-follow-up-rules";
import type { CrmPromptRecordMap } from "@/lib/crm-ai-prompt-rules";
import { toast } from "sonner";
import { CrmFollowUpWizard } from "./CrmFollowUpWizard";
import { CrmLeadFunnelPromptWizard } from "./CrmLeadFunnelPromptWizard";
import { CrmLeadStatusPromptWizard } from "./CrmLeadStatusPromptWizard";
import { LoadingState } from "./LoadingState";
import { Separator } from "@/components/ui/separator";

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

  useEffect(() => {
    if (rules.length === 0 && !rulesLoading) {
      void loadRules();
    }

    if (!promptRecords && !promptsLoading) {
      void loadPrompts();
    }
  }, [
    loadPrompts,
    loadRules,
    promptRecords,
    promptsLoading,
    rules.length,
    rulesLoading,
  ]);

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
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList className="flex justify-start">
        <TabsTrigger value="followUps">
          Follow-ups
        </TabsTrigger>

        <TabsTrigger value="leadStatus">
          Clasificacion lead
        </TabsTrigger>

        <TabsTrigger value="leadFunnel">
          Sintetizador
        </TabsTrigger>
      </TabsList>

      <Separator />

      <TabsContent value="followUps">
        <CrmFollowUpWizard
          rules={rules}
          loading={rulesLoading}
          timezone={timezone}
          timeOptions={timeOptions}
          hasChanges={hasChanges}
          isSaving={isSaving}
          handleResetAll={handleResetAll}
          handleSave={handleSave}
          onPatchRule={patchRule}
          onToggleWeekday={toggleWeekday}
          onResetRuleToDefault={resetRuleToDefault}
        />
      </TabsContent>

      <TabsContent value="leadStatus">
        {promptsLoading && !promptRecords ? (
          <LoadingState label="Cargando wizard de clasificacion..." />
        ) : promptRecords ? (
          <CrmLeadStatusPromptWizard
            userId={userId}
            record={promptRecords.leadStatus}
            onSaved={(nextRecord) =>
              setPromptRecords((current) =>
                current
                  ? {
                    ...current,
                    leadStatus: nextRecord,
                  }
                  : current
              )
            }
          />
        ) : (
          <LoadingState label="Sin configuracion disponible." />
        )}
      </TabsContent>

      <TabsContent value="leadFunnel">
        {promptsLoading && !promptRecords ? (
          <LoadingState label="Cargando wizard del sintetizador..." />
        ) : promptRecords ? (
          <CrmLeadFunnelPromptWizard
            userId={userId}
            record={promptRecords.leadFunnel}
            onSaved={(nextRecord) =>
              setPromptRecords((current) =>
                current
                  ? {
                    ...current,
                    leadFunnel: nextRecord,
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
  );
}
