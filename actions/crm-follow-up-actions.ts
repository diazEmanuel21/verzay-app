"use server";

import { db } from "@/lib/db";
import { assertAuthorizedCrmFeatureEnabled } from "@/actions/crm-feature-access";
import {
  computeCrmFollowUpScheduledFor,
  normalizeCrmFollowUpRule,
} from "@/lib/crm-follow-up-rules";
import { buildWhatsAppJidCandidates } from "@/lib/whatsapp-jid";

export type CrmFollowUpSessionActionResult = {
  success: boolean;
  message: string;
  data?: {
    count: number;
  };
};

type CrmFollowUpSessionInput = {
  userId: string;
  remoteJid: string;
  instanceId: string;
};

function normalizeSessionInput(input: CrmFollowUpSessionInput) {
  return {
    userId: input.userId.trim(),
    remoteJid: input.remoteJid.trim(),
    instanceId: input.instanceId.trim(),
  };
}

async function ensureSessionOwnership(input: CrmFollowUpSessionInput) {
  const normalized = normalizeSessionInput(input);
  const candidates = buildWhatsAppJidCandidates(normalized.remoteJid);

  if (!normalized.userId || !normalized.remoteJid || !normalized.instanceId) {
    return {
      ok: false as const,
      result: {
        success: false,
        message: "Faltan datos para operar el follow-up.",
      } satisfies CrmFollowUpSessionActionResult,
    };
  }

  const session = await db.session.findFirst({
    where: {
      userId: normalized.userId,
      instanceId: normalized.instanceId,
      OR: [
        { remoteJid: { in: candidates } },
        { remoteJidAlt: { in: candidates } },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    return {
      ok: false as const,
      result: {
        success: false,
        message: "La sesion no pertenece al usuario actual.",
      } satisfies CrmFollowUpSessionActionResult,
    };
  }

  return {
    ok: true as const,
    input: {
      ...normalized,
      id: session.id,
    },
  };
}

export async function cancelSessionCrmFollowUps(
  input: CrmFollowUpSessionInput
): Promise<CrmFollowUpSessionActionResult> {
  try {
    const sessionCheck = await ensureSessionOwnership(input);
    if (!sessionCheck.ok) return sessionCheck.result;

    const result = await db.crmFollowUp.updateMany({
      where: {
        sessionId: sessionCheck.input.id,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return {
      success: true,
      message:
        result.count === 0
          ? "No hay follow-ups activos para cancelar."
          : result.count === 1
            ? "Se cancelo 1 follow-up activo."
            : `Se cancelaron ${result.count} follow-ups activos.`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("[cancelSessionCrmFollowUps]", error);
    return {
      success: false,
      message: "No se pudieron cancelar los follow-ups.",
    };
  }
}

export async function retrySessionFailedCrmFollowUps(
  input: CrmFollowUpSessionInput
): Promise<CrmFollowUpSessionActionResult> {
  try {
    const sessionCheck = await ensureSessionOwnership(input);
    if (!sessionCheck.ok) return sessionCheck.result;
    await assertAuthorizedCrmFeatureEnabled(sessionCheck.input.userId, "crmFollowUps");

    const failedFollowUps = await db.crmFollowUp.findMany({
      where: {
        sessionId: sessionCheck.input.id,
        status: "FAILED",
      },
      select: {
        id: true,
        leadStatusSnapshot: true,
      },
    });

    if (failedFollowUps.length === 0) {
      return {
        success: true,
        message: "No hay follow-ups fallidos para reactivar.",
        data: { count: 0 },
      };
    }

    const [user, rules] = await Promise.all([
      db.user.findUnique({
        where: { id: sessionCheck.input.userId },
        select: { timezone: true },
      }),
      db.crmFollowUpRule.findMany({
        where: {
          userId: sessionCheck.input.userId,
          leadStatus: {
            in: Array.from(new Set(failedFollowUps.map((item) => item.leadStatusSnapshot))),
          },
        },
        select: {
          id: true,
          userId: true,
          leadStatus: true,
          enabled: true,
          delayMinutes: true,
          maxAttempts: true,
          goal: true,
          prompt: true,
          fallbackMessage: true,
          allowedWeekdays: true,
          sendStartTime: true,
          sendEndTime: true,
          updatedAt: true,
        },
      }),
    ]);

    const rulesByStatus = new Map(
      rules.map((rule) => [
        rule.leadStatus,
        normalizeCrmFollowUpRule({
          ...rule,
          updatedAt: rule.updatedAt?.toISOString?.() ?? null,
        }),
      ])
    );

    const updates = failedFollowUps.flatMap((followUp) => {
      const rule = rulesByStatus.get(followUp.leadStatusSnapshot);

      if (!rule || !rule.enabled) {
        return [];
      }

      const scheduledFor = computeCrmFollowUpScheduledFor({
        delayMinutes: rule.delayMinutes,
        timeZone: user?.timezone ?? null,
        allowedWeekdays: rule.allowedWeekdays,
        sendStartTime: rule.sendStartTime,
        sendEndTime: rule.sendEndTime,
      });

      return [
        db.crmFollowUp.update({
          where: { id: followUp.id },
          data: {
            status: "PENDING",
            attemptCount: 0,
            generatedMessage: null,
            errorReason: null,
            lastProcessedAt: null,
            sentAt: null,
            cancelledAt: null,
            scheduledFor,
            maxAttempts: rule.maxAttempts,
            goalSnapshot: rule.goal,
            promptSnapshot: rule.prompt,
            fallbackMessageSnapshot: rule.fallbackMessage,
            allowedWeekdaysSnapshot: rule.allowedWeekdays,
            sendStartTimeSnapshot: rule.sendStartTime,
            sendEndTimeSnapshot: rule.sendEndTime,
          },
        }),
      ];
    });

    if (updates.length === 0) {
      return {
        success: false,
        message: "Las reglas actuales no permiten reactivar los follow-ups fallidos.",
      };
    }

    await db.$transaction(updates);

    return {
      success: true,
      message:
        updates.length === 1
          ? "Se reactivo 1 follow-up fallido."
          : `Se reactivaron ${updates.length} follow-ups fallidos.`,
      data: { count: updates.length },
    };
  } catch (error) {
    console.error("[retrySessionFailedCrmFollowUps]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudieron reactivar los follow-ups fallidos.",
    };
  }
}
