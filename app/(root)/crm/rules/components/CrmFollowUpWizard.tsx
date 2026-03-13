"use client";

import { Loader2, RotateCcw, Settings2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    CRM_FOLLOW_UP_RULE_STATUS_ORDER,
    CRM_FOLLOW_UP_WEEKDAY_OPTIONS,
    type CrmFollowUpRuleConfig,
} from "@/lib/crm-follow-up-rules";
import { cn } from "@/lib/utils";
import { getLeadStatusLabel } from "../../dashboard/helpers";
import { LoadingState } from "./LoadingState";
import { ScrollArea } from "@/components/ui/scroll-area";

type CrmFollowUpWizardProps = {
    rules: CrmFollowUpRuleConfig[];
    loading: boolean;
    timezone: string | null;
    timeOptions: string[];
    hasChanges: boolean;
    isSaving: boolean;
    handleResetAll: () => void;
    handleSave: () => void;
    onPatchRule: (
        leadStatus: CrmFollowUpRuleConfig["leadStatus"],
        patch: Partial<CrmFollowUpRuleConfig>
    ) => void;
    onToggleWeekday: (
        leadStatus: CrmFollowUpRuleConfig["leadStatus"],
        weekday: number
    ) => void;
    onResetRuleToDefault: (
        leadStatus: CrmFollowUpRuleConfig["leadStatus"]
    ) => void;
};

export function CrmFollowUpWizard({
    rules,
    loading,
    timezone,
    timeOptions,
    hasChanges,
    isSaving,
    handleResetAll,
    handleSave,
    onPatchRule,
    onToggleWeekday,
    onResetRuleToDefault,
}: CrmFollowUpWizardProps) {
    if (loading && rules.length === 0) {
        return <LoadingState label="Cargando reglas de follow-up..." />;
    }

    return (
        <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col flex-1 gap-2">
                <div className="flex flex-row items-center gap-2 text-sm">
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                        IA CRM
                    </Badge>
                    <span className="text-muted-foreground">
                        Zona horaria actual: {timezone || "America/Bogota"}
                    </span>
                </div>
                <ScrollArea>
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
                                                    onPatchRule(leadStatus, { enabled: checked })
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
                                                    onPatchRule(leadStatus, {
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
                                                    onPatchRule(leadStatus, {
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
                                                    onPatchRule(leadStatus, { sendStartTime: value })
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
                                                    onPatchRule(leadStatus, { sendEndTime: value })
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
                                                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                                                : "border-border bg-background text-muted-foreground",
                                                            !rule.enabled && "cursor-not-allowed opacity-60"
                                                        )}
                                                        onClick={() => onToggleWeekday(leadStatus, option.value)}
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
                                                    onPatchRule(leadStatus, { goal: event.target.value })
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
                                                    onPatchRule(leadStatus, { prompt: event.target.value })
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
                                                    onPatchRule(leadStatus, {
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
                                            onClick={() => onResetRuleToDefault(leadStatus)}
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Restaurar defaults
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </ScrollArea>
            </div>

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
                    disabled={!hasChanges || isSaving || loading}
                >
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Settings2 className="mr-2 h-4 w-4" />
                    )}
                    Guardar reglas
                </Button>
            </div >
        </div>
    );
}
