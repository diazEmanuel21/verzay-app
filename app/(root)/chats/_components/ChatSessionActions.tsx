'use client';

import { SwitchStatus, SwitchAgentDisabled } from '../../sessions/_components';
import type { Session } from '@/types/session';

type ChatSessionActionsProps = {
  session: Session | null;
  userId: string;
  mutateSessions: () => void;
};

export function ChatSessionActions({ session, userId, mutateSessions }: ChatSessionActionsProps) {
  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/15 px-2 py-1">
        <span className="font-medium">Sesión</span>
        <SwitchStatus
          checked={Boolean(session.status)}
          sessionId={session.id}
          mutateSessions={mutateSessions}
        />
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/15 px-2 py-1">
        <span className="font-medium">Agente</span>
        <SwitchAgentDisabled
          agentDisabled={Boolean(session.agentDisabled)}
          userId={userId}
          sessionId={session.id}
          mutateSessions={mutateSessions}
        />
      </div>
    </div>
  );
}
