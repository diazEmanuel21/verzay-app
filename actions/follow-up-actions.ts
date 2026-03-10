"use server";

import { assertUserCanUseApp } from "@/actions/billing/helpers/app-access-guard";
import { db } from "@/lib/db";

export type FollowUpSessionActionResult = {
  success: boolean;
  message: string;
  data?: {
    count: number;
  };
};

export type FollowUpRunnerActionResult = {
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

type ProcessFollowUpOptions = {
  limit?: number;
  remoteJid?: string;
  instanceId?: string;
};

type FollowUpSessionInput = {
  userId: string;
  remoteJid: string;
  instanceId: string;
};

function parseStoredIds(value?: string | null) {
  if (!value || !value.trim()) return [];

  return value
    .split(/[-,]/)
    .map((segment) => Number.parseInt(segment.trim(), 10))
    .filter((id) => !Number.isNaN(id));
}

function buildStoredIds(ids: number[]) {
  return ids.length ? ids.map((id) => id.toString()).join("-") : "";
}

function buildFollowUpRunnerUrl(webhookUrl: string) {
  const trimmed = webhookUrl.trim().replace(/\/+$/, "");
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(normalized);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (!pathname || pathname === "/") {
    url.pathname = "/webhook/follow-up/process";
    return url.toString();
  }

  if (pathname.endsWith("/follow-up/process")) {
    url.pathname = pathname;
    return url.toString();
  }

  if (pathname.endsWith("/webhook")) {
    url.pathname = `${pathname}/follow-up/process`;
    return url.toString();
  }

  url.pathname = `${pathname}/follow-up/process`;
  return url.toString();
}

function normalizeSessionInput(input: FollowUpSessionInput) {
  return {
    userId: input.userId.trim(),
    remoteJid: input.remoteJid.trim(),
    instanceId: input.instanceId.trim(),
  };
}

async function ensureSessionOwnership(input: FollowUpSessionInput) {
  const normalized = normalizeSessionInput(input);

  if (!normalized.userId || !normalized.remoteJid || !normalized.instanceId) {
    return {
      ok: false as const,
      result: {
        success: false,
        message: "Faltan datos para operar el follow-up.",
      } satisfies FollowUpSessionActionResult,
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
      seguimientos: true,
      inactividad: true,
    },
  });

  if (!session) {
    return {
      ok: false as const,
      result: {
        success: false,
        message: "La sesion no pertenece al usuario actual.",
      } satisfies FollowUpSessionActionResult,
    };
  }

  return {
    ok: true as const,
    input: {
      ...normalized,
      id: session.id,
      seguimientos: session.seguimientos,
      inactividad: session.inactividad,
    },
  };
}

export async function cancelSessionFollowUps(
  input: FollowUpSessionInput
): Promise<FollowUpSessionActionResult> {
  try {
    const sessionCheck = await ensureSessionOwnership(input);
    if (!sessionCheck.ok) return sessionCheck.result;

    const activeFollowUps = await db.seguimiento.findMany({
      where: {
        remoteJid: sessionCheck.input.remoteJid,
        instancia: sessionCheck.input.instanceId,
        followUpStatus: {
          in: ["pending", "processing"],
        },
      },
      select: { id: true },
    });

    if (activeFollowUps.length === 0) {
      return {
        success: true,
        message: "No hay follow-ups activos para cancelar.",
        data: { count: 0 },
      };
    }

    const activeIds = activeFollowUps.map((followUp) => followUp.id);
    const nextSeguimientos = parseStoredIds(sessionCheck.input.seguimientos).filter(
      (id) => !activeIds.includes(id)
    );
    const nextInactividad = parseStoredIds(sessionCheck.input.inactividad).filter(
      (id) => !activeIds.includes(id)
    );

    await db.$transaction([
      db.seguimiento.updateMany({
        where: {
          id: {
            in: activeIds,
          },
        },
        data: {
          followUpStatus: "cancelled",
        },
      }),
      db.session.update({
        where: { id: sessionCheck.input.id },
        data: {
          seguimientos: buildStoredIds(nextSeguimientos),
          inactividad: buildStoredIds(nextInactividad),
        },
      }),
    ]);

    return {
      success: true,
      message:
        activeIds.length === 1
          ? "Se cancelo 1 follow-up activo."
          : `Se cancelaron ${activeIds.length} follow-ups activos.`,
      data: { count: activeIds.length },
    };
  } catch (error) {
    console.error("[cancelSessionFollowUps]", error);
    return {
      success: false,
      message: "No se pudieron cancelar los follow-ups.",
    };
  }
}

export async function retrySessionFailedFollowUps(
  input: FollowUpSessionInput
): Promise<FollowUpSessionActionResult> {
  try {
    const sessionCheck = await ensureSessionOwnership(input);
    if (!sessionCheck.ok) return sessionCheck.result;

    const failedFollowUps = await db.seguimiento.findMany({
      where: {
        remoteJid: sessionCheck.input.remoteJid,
        instancia: sessionCheck.input.instanceId,
        followUpStatus: "failed",
      },
      select: { id: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    if (!failedFollowUps.length) {
      return {
        success: true,
        message: "No hay follow-ups fallidos para reactivar.",
        data: { count: 0 },
      };
    }

    const resetAt = new Date();
    const nextSeguimientos = new Set(parseStoredIds(sessionCheck.input.seguimientos));
    for (const followUp of failedFollowUps) {
      nextSeguimientos.add(followUp.id);
    }

    await db.$transaction([
      ...failedFollowUps.map((followUp) =>
        db.seguimiento.update({
          where: { id: followUp.id },
          data: {
            followUpStatus: "pending",
            followUpAttempt: 0,
            generatedMessage: null,
            errorReason: null,
            createdAt: resetAt,
          },
        })
      ),
      db.session.update({
        where: { id: sessionCheck.input.id },
        data: {
          seguimientos: buildStoredIds(Array.from(nextSeguimientos).sort((a, b) => a - b)),
        },
      }),
    ]);

    return {
      success: true,
      message:
        failedFollowUps.length === 1
          ? "Se reactivo 1 follow-up fallido."
          : `Se reactivaron ${failedFollowUps.length} follow-ups fallidos.`,
      data: { count: failedFollowUps.length },
    };
  } catch (error) {
    console.error("[retrySessionFailedFollowUps]", error);
    return {
      success: false,
      message: "No se pudieron reactivar los follow-ups fallidos.",
    };
  }
}

export async function processDueFollowUpsNow(
  userId: string,
  options?: ProcessFollowUpOptions
): Promise<FollowUpRunnerActionResult> {
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
    const runnerUrlSource = (process.env.FOLLOW_UP_RUNNER_URL ?? "").trim() || configuredWebhookUrl;
    if (!runnerUrlSource) {
      return {
        success: false,
        message: "No hay URL configurada para ejecutar el runner de follow-up.",
      };
    }

    const endpoint = buildFollowUpRunnerUrl(runnerUrlSource);
    const requestedLimit = Number(options?.limit ?? 25);
    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 25;
    const runnerKey = (process.env.FOLLOW_UP_RUNNER_KEY ?? "").trim();

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
        message: detail || "No se pudo ejecutar el runner de follow-up.",
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
            ? "No habia follow-ups vencidos para esta sesion."
            : "No habia follow-ups vencidos para procesar."
          : remoteJid && instanceId
            ? `Sesion procesada. Enviados: ${data.sent}, fallidos: ${data.failed}, omitidos: ${data.skipped}.`
            : `Runner ejecutado. Enviados: ${data.sent}, fallidos: ${data.failed}, omitidos: ${data.skipped}.`,
      data,
    };
  } catch (error) {
    console.error("[processDueFollowUpsNow]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo ejecutar el runner de follow-up.",
    };
  }
}
