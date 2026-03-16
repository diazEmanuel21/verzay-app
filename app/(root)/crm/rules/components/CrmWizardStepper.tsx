"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

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
    <TooltipProvider>
      <div className="grid gap-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;

          return (
            <Tooltip key={step.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto items-start justify-start rounded-2xl border text-left",
                    isActive ? "border-blue-300" : "border-border/70"
                  )}
                  onClick={() => onStepChange(step.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-row gap-2">
                      <InfoIcon className="text-blue-300" />
                      <div className="font-semibold uppercase tracking-[0.18em]">
                        Paso {index + 1}
                      </div>
                    </div>

                    <div>{step.title}</div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{step.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
