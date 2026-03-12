"use server";

import { assertUserCanUseApp } from "@/actions/billing/helpers/app-access-guard";
import { db } from "@/lib/db";

export type CrmFollowUpSessionActionResult = {
  success: boolean;
  message: string;
  data?: {
    count: number;
  };
};

export type CrmFollowUpRunnerActionResult = {
  success: boolean;
  message: string;
  data?: {
    scanned: number;
    due: number;
    sent: number;
    failed: number;
    skipped: number;
  };
};

type ProcessCrmFollowUpOptions = {
  limit?: number;
  remoteJid?: string;
  instanceId?: string;
};

type CrmFollowUpSessionInput = {
  userId: string;
  remoteJid: string;
  instanceId: string;
};

function buildCrmFollowUpRunnerUrl(webhookUrl: string) {
  const trimmed = webhookUrl.trim().replace(/\/+$/, "");
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(normalized);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (!pathname || pathname === "/") {
    url.pathname = "/lead-funnel/crm-follow-up/process";
    return url.toString();
  }

  if (pathname.endsWith("/crm-follow-up/process")) {
    url.pathname = pathname;
    return url.toString();
  }

  if (pathname.endsWith("/webhook")) {
    url.pathname = `${pathname.slice(0, -"/webhook".length)}/lead-funnel/crm-follow-up/process`;
    return url.toString();
  }

  url.pathname = `${pathname}/crm-follow-up/process`;
  return url.toString();
}

function normalizeSessionInput(input: CrmFollowUpSessionInput) {
  return {
    userId: input.userId.trim(),
    remoteJid: input.remoteJid.trim(),
    instanceId: input.instanceId.trim(),
  };
}

async function ensureSessionOwnership(input: CrmFollowUpSessionInput) {
  const normalized = normalizeSessionInput(input);

  if (!normalized.userId || !normalized.remoteJid || !normalized.instanceId) {
    return {
      ok: false as const,
      result: {
        success: false,
        message: "Faltan datos para operar el CRM follow-up.",
      } satisfies CrmFollowUpSessionActionResult,
    };
  }

  const session = await db.session.findFirst({
    where: {
      userId: normalized.userId,
      remoteJid: normalized.remoteJid,
      instanceId: normalized.instanceId,
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
          ? "No hay CRM follow-ups activos para cancelar."
          : result.count === 1
            ? "Se cancelo 1 CRM follow-up activo."
            : `Se cancelaron ${result.count} CRM follow-ups activos.`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("[cancelSessionCrmFollowUps]", error);
    return {
      success: false,
      message: "No se pudieron cancelar los CRM follow-ups.",
    };
  }
}

export async function retrySessionFailedCrmFollowUps(
  input: CrmFollowUpSessionInput
): Promise<CrmFollowUpSessionActionResult> {
  try {
    const sessionCheck = await ensureSessionOwnership(input);
    if (!sessionCheck.ok) return sessionCheck.result;

    const resetAt = new Date();
    const result = await db.crmFollowUp.updateMany({
      where: {
        sessionId: sessionCheck.input.id,
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        attemptCount: 0,
        generatedMessage: null,
        errorReason: null,
        lastProcessedAt: null,
        sentAt: null,
        cancelledAt: null,
        scheduledFor: resetAt,
      },
    });

    return {
      success: true,
      message:
        result.count === 0
          ? "No hay CRM follow-ups fallidos para reactivar."
          : result.count === 1
            ? "Se reactivó 1 CRM follow-up fallido."
            : `Se reactivaron ${result.count} CRM follow-ups fallidos.`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("[retrySessionFailedCrmFollowUps]", error);
    return {
      success: false,
      message: "No se pudieron reactivar los CRM follow-ups fallidos.",
    };
  }
}

export async function processDueCrmFollowUpsNow(
  userId: string,
  options?: ProcessCrmFollowUpOptions
): Promise<CrmFollowUpRunnerActionResult> {
  try {
    await assertUserCanUseApp(userId);

    const safeUserId = userId.trim();
    const remoteJid = options?.remoteJid?.trim();
    const instanceId = options?.instanceId?.trim();

    if ((remoteJid && !instanceId) || (!remoteJid && instanceId)) {
      return {
        success: false,
        message: "Para procesar una sesion debes enviar remoteJid e instanceId.",
      };
    }

    if (remoteJid && instanceId) {
      const sessionCheck = await ensureSessionOwnership({
        userId: safeUserId,
        remoteJid,
        instanceId,
      });

      if (!sessionCheck.ok) {
        return {
          success: false,
          message: sessionCheck.result.message,
        };
      }
    }

    const user = await db.user.findUnique({
      where: { id: safeUserId },
      select: { webhookUrl: true },
    });

    const configuredWebhookUrl = (user?.webhookUrl ?? "").trim();
    const runnerUrlSource = (process.env.CRM_FOLLOW_UP_RUNNER_URL ?? "").trim() || configuredWebhookUrl;
    if (!runnerUrlSource) {
      return {
        success: false,
        message: "No hay URL configurada para ejecutar el runner de CRM follow-up.",
      };
    }

    const endpoint = buildCrmFollowUpRunnerUrl(runnerUrlSource);
    const requestedLimit = Number(options?.limit ?? 25);
    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 25;
    const runnerKey =
      (process.env.CRM_FOLLOW_UP_RUNNER_KEY ?? "").trim()
      || (process.env.FOLLOW_UP_RUNNER_KEY ?? "").trim();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(runnerKey ? { "x-runner-key": runnerKey } : {}),
      },
      body: JSON.stringify({
        limit: safeLimit,
        userId: safeUserId,
        remoteJid: remoteJid || undefined,
        instanceId: instanceId || undefined,
      }),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const detail =
        typeof payload === "string"
          ? payload
          : payload?.message || JSON.stringify(payload);

      return {
        success: false,
        message: detail || "No se pudo ejecutar el runner de CRM follow-up.",
      };
    }

    const data = {
      scanned: Number(payload?.scanned ?? 0),
      due: Number(payload?.due ?? 0),
      sent: Number(payload?.sent ?? 0),
      failed: Number(payload?.failed ?? 0),
      skipped: Number(payload?.skipped ?? 0),
    };

    return {
      success: true,
      message:
        data.due === 0
          ? remoteJid && instanceId
            ? "No habia CRM follow-ups vencidos para esta sesion."
            : "No habia CRM follow-ups vencidos para procesar."
          : remoteJid && instanceId
            ? `CRM follow-up de la sesion procesado. Enviados: ${data.sent}, fallidos: ${data.failed}, omitidos: ${data.skipped}.`
            : `Runner de CRM follow-up ejecutado. Enviados: ${data.sent}, fallidos: ${data.failed}, omitidos: ${data.skipped}.`,
      data,
    };
  } catch (error) {
    console.error("[processDueCrmFollowUpsNow]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo ejecutar el runner de CRM follow-up.",
    };
  }
}
