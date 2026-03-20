export type ChatConversationPreference = {
  remoteJid: string;
  pinnedAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
};

export type ChatConversationPreferenceMap = Record<string, ChatConversationPreference>;

export type ChatWorkflowOption = {
  id: string;
  name: string;
  isPro: boolean;
};

export type ChatQuickReplyOption = {
  id: number;
  message: string;
  workflowId: string;
  workflowName: string | null;
};

export type ChatToolActionResult =
  | {
      success: true;
      message: string;
      data?: {
        sentCount?: number;
        skippedCount?: number;
      };
    }
  | {
      success: false;
      message: string;
    };
