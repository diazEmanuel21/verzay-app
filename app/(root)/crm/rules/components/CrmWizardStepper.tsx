"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CrmWizardStep = {
  id: string;
  title: string;
  description: string;
};

export function CrmWizardStepper({
  steps,
  currentStep,
  onStepChange,
}: {
  steps: CrmWizardStep[];
  currentStep: string;
  onStepChange: (stepId: string) => void;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;

        return (
          <Button
            key={step.id}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto items-start justify-start rounded-2xl border px-4 py-3 text-left",
              isActive
                ? "border-sky-300 bg-sky-50 text-sky-900"
                : "border-border/70 bg-background text-muted-foreground"
            )}
            onClick={() => onStepChange(step.id)}
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]">
                Paso {index + 1}
              </div>
              <div className="text-sm font-semibold">{step.title}</div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
