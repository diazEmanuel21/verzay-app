"use server";

import { Prisma, PromptStatus } from "@prisma/client";

import { assertUserCanUseApp } from "@/actions/billing/helpers/app-access-guard";
import { db } from "@/lib/db";
import {
  CRM_AGENT_PROMPT_IDS,
  type CrmPromptKind,
  type CrmPromptRecordMap,
  type CrmLeadFunnelPromptConfig,
  type CrmLeadStatusPromptConfig,
  buildLeadFunnelPromptFromConfig,
  buildLeadStatusPromptFromConfig,
  createCrmPromptRecord,
  normalizeCrmLeadFunnelPromptConfig,
  normalizeCrmLeadStatusPromptConfig,
} from "@/lib/crm-ai-prompt-rules";

type PromptActionResult<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type UpdateCrmPromptRuleInput =
  | {
      userId: string;
      kind: "leadStatus";
      config: CrmLeadStatusPromptConfig;
    }
  | {
      userId: string;
      kind: "leadFunnel";
      config: CrmLeadFunnelPromptConfig;
    };

async function findCrmPrompt(userId: string, kind: CrmPromptKind) {
  return db.agentPrompt.findFirst({
    where: {
      userId,
      agentId: CRM_AGENT_PROMPT_IDS[kind],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

async function ensureCrmPrompt(
  userId: string,
  kind: "leadStatus"
): Promise<CrmPromptRecordMap["leadStatus"]>;
async function ensureCrmPrompt(
  userId: string,
  kind: "leadFunnel"
): Promise<CrmPromptRecordMap["leadFunnel"]>;
async function ensureCrmPrompt(userId: string, kind: CrmPromptKind) {
  const existing = await findCrmPrompt(userId, kind);
  if (kind === "leadStatus") {
    const config = normalizeCrmLeadStatusPromptConfig(existing?.sections);
    const promptText = existing?.promptText || buildLeadStatusPromptFromConfig(config);

    if (existing) {
      return createCrmPromptRecord("leadStatus", {
        id: existing.id,
        version: existing.version,
        promptText,
        config,
        updatedAt: existing.updatedAt?.toISOString?.() ?? null,
      });
    }

    const created = await db.agentPrompt.create({
      data: {
        userId,
        agentId: CRM_AGENT_PROMPT_IDS.leadStatus,
        status: PromptStatus.published,
        sections: config as Prisma.InputJsonValue,
        promptText,
        businessName: "CRM",
        businessSector: "leadStatus",
      },
    });

    return createCrmPromptRecord("leadStatus", {
      id: created.id,
      version: created.version,
      promptText: created.promptText,
      config,
      updatedAt: created.updatedAt?.toISOString?.() ?? null,
    });
  }

  const config = normalizeCrmLeadFunnelPromptConfig(existing?.sections);
  const promptText = existing?.promptText || buildLeadFunnelPromptFromConfig(config);

  if (existing) {
    return createCrmPromptRecord("leadFunnel", {
      id: existing.id,
      version: existing.version,
      promptText,
      config,
      updatedAt: existing.updatedAt?.toISOString?.() ?? null,
    });
  }

  const created = await db.agentPrompt.create({
    data: {
      userId,
      agentId: CRM_AGENT_PROMPT_IDS.leadFunnel,
      status: PromptStatus.published,
      sections: config as Prisma.InputJsonValue,
      promptText,
      businessName: "CRM",
      businessSector: "leadFunnel",
    },
  });

  return createCrmPromptRecord("leadFunnel", {
    id: created.id,
    version: created.version,
    promptText: created.promptText,
    config,
    updatedAt: created.updatedAt?.toISOString?.() ?? null,
  });
}

export async function getCrmPromptRules(
  userId: string
): Promise<PromptActionResult<CrmPromptRecordMap>> {
  try {
    await assertUserCanUseApp(userId);

    const [leadStatus, leadFunnel] = await Promise.all([
      ensureCrmPrompt(userId, "leadStatus"),
      ensureCrmPrompt(userId, "leadFunnel"),
    ]);

    return {
      success: true,
      message: "Prompts CRM cargados.",
      data: {
        leadStatus,
        leadFunnel,
      },
    };
  } catch (error) {
    console.error("[getCrmPromptRules]", error);
    return {
      success: false,
      message: "No se pudieron cargar los prompts del CRM.",
    };
  }
}

export async function updateCrmPromptRule(input: {
  userId: string;
  kind: "leadStatus";
  config: CrmLeadStatusPromptConfig;
}): Promise<PromptActionResult<CrmPromptRecordMap["leadStatus"]>>;
export async function updateCrmPromptRule(input: {
  userId: string;
  kind: "leadFunnel";
  config: CrmLeadFunnelPromptConfig;
}): Promise<PromptActionResult<CrmPromptRecordMap["leadFunnel"]>>;
export async function updateCrmPromptRule(
  input: UpdateCrmPromptRuleInput
): Promise<
  | PromptActionResult<CrmPromptRecordMap["leadStatus"]>
  | PromptActionResult<CrmPromptRecordMap["leadFunnel"]>
> {
  try {
    await assertUserCanUseApp(input.userId);

    const existing = await findCrmPrompt(input.userId, input.kind);
    if (input.kind === "leadStatus") {
      const config = normalizeCrmLeadStatusPromptConfig(input.config);
      const promptText = buildLeadStatusPromptFromConfig(config);
      const saved = existing
        ? await db.agentPrompt.update({
            where: { id: existing.id },
            data: {
              status: PromptStatus.published,
              sections: config as Prisma.InputJsonValue,
              promptText,
              businessName: "CRM",
              businessSector: "leadStatus",
              version: { increment: 1 },
            },
          })
        : await db.agentPrompt.create({
            data: {
              userId: input.userId,
              agentId: CRM_AGENT_PROMPT_IDS.leadStatus,
              status: PromptStatus.published,
              sections: config as Prisma.InputJsonValue,
              promptText,
              businessName: "CRM",
              businessSector: "leadStatus",
            },
          });

      return {
        success: true,
        message: "Prompt CRM actualizado.",
        data: createCrmPromptRecord("leadStatus", {
          id: saved.id,
          version: saved.version,
          promptText: saved.promptText,
          config,
          updatedAt: saved.updatedAt?.toISOString?.() ?? null,
        }),
      };
    }

    const config = normalizeCrmLeadFunnelPromptConfig(input.config);
    const promptText = buildLeadFunnelPromptFromConfig(config);
    const saved = existing
      ? await db.agentPrompt.update({
          where: { id: existing.id },
          data: {
            status: PromptStatus.published,
            sections: config as Prisma.InputJsonValue,
            promptText,
            businessName: "CRM",
            businessSector: "leadFunnel",
            version: { increment: 1 },
          },
        })
      : await db.agentPrompt.create({
          data: {
            userId: input.userId,
            agentId: CRM_AGENT_PROMPT_IDS.leadFunnel,
            status: PromptStatus.published,
            sections: config as Prisma.InputJsonValue,
            promptText,
            businessName: "CRM",
            businessSector: "leadFunnel",
          },
        });

    return {
      success: true,
      message: "Prompt CRM actualizado.",
      data: createCrmPromptRecord("leadFunnel", {
        id: saved.id,
        version: saved.version,
        promptText: saved.promptText,
        config,
        updatedAt: saved.updatedAt?.toISOString?.() ?? null,
      }),
    };
  } catch (error) {
    console.error("[updateCrmPromptRule]", error);
    return {
      success: false,
      message: "No se pudo actualizar el prompt del CRM.",
    };
  }
}
