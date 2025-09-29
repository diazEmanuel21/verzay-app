import { ChatMain } from "./_components.tsx/chat-main";
import { ChatSidebar } from "./_components.tsx/chat-sidebar";

export default function ChatsPage() {
  return (
    <div className="flex h-full">
      <ChatSidebar />
      <ChatMain />
    </div>
  );
}