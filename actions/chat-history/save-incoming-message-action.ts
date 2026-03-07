'use server';

import { buildChatHistorySessionId } from '@/lib/chat-history/build-session-id';
import { saveChatHistoryMessage } from '@/lib/chat-history/chat-history.helper';

interface SaveIncomingMessageActionInput {
  instanceName: string;
  remoteJid: string;
  message: string;
  additionalKwargs?: Record<string, unknown>;
  responseMetadata?: Record<string, unknown>;
}

export async function saveIncomingMessageAction({
  instanceName,
  remoteJid,
  message,
  additionalKwargs,
  responseMetadata,
}: SaveIncomingMessageActionInput) {
  const sessionId = buildChatHistorySessionId(instanceName, remoteJid);

  await saveChatHistoryMessage({
    sessionId,
    content: message,
    type: 'human',
    additionalKwargs,
    responseMetadata,
  });

  return { success: true };
}
