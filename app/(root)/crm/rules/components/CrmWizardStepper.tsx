"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, CircleHelp } from "lucide-react";

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
  if (steps.length === 0) return null;

  const currentIndex = Math.max(
    steps.findIndex((step) => step.id === currentStep),
    0
  );

  return (
    <TooltipProvider delayDuration={120}>
      <ScrollArea className="w-full whitespace-nowrap rounded-2xl">
        <div className="flex w-max gap-2 px-1 pb-3">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentIndex;

              return (
                <Tooltip key={step.id}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`${step.title}. ${step.description}`}
                      className={cn(
                        "h-auto min-w-[172px] items-start justify-start rounded-2xl border px-3 py-3 text-left whitespace-normal transition-colors sm:min-w-[188px]",
                        isActive &&
                          "border-primary/25 bg-primary/5 text-foreground shadow-sm",
                        isCompleted &&
                          !isActive &&
                          "border-primary/15 bg-muted/45 text-foreground",
                        !isActive &&
                          !isCompleted &&
                          "border-border/70 bg-background/80 text-muted-foreground hover:border-border hover:bg-accent/40 hover:text-foreground"
                      )}
                      onClick={() => onStepChange(step.id)}
                    >
                      <div className="flex w-full items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            isActive &&
                              "border-primary bg-primary text-primary-foreground",
                            isCompleted &&
                              !isActive &&
                              "border-primary/20 bg-primary/10 text-primary",
                            !isActive &&
                              !isCompleted &&
                              "border-border/70 bg-muted/60 text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Paso {index + 1}
                          </div>
                          <div
                            className={cn(
                              "line-clamp-2 text-sm font-medium leading-tight",
                              isActive ? "text-foreground" : "text-inherit"
                            )}
                          >
                            {step.title}
                          </div>
                        </div>

                        <CircleHelp
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground/70"
                          )}
                        />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-64">
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {step.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </TooltipProvider>
  );
}
