"use client";

import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/session";
import {
  getLeadStatusLabel,
  LEAD_STATUS_BADGE_CLASSNAMES,
} from "../../helpers";

export function LeadStatusBadge({
  status,
}: {
  status?: LeadStatus | null;
}) {
  if (!status) {
    return (
      <span className="inline-flex rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
        Sin clasificar
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-xs font-medium",
        LEAD_STATUS_BADGE_CLASSNAMES[status],
      )}
    >
      {getLeadStatusLabel(status)}
    </span>
  );
}
