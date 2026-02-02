import { currentUser } from "@/lib/auth";
import { themeClass } from "@/types/generic";

import "@xyflow/react/dist/style.css";

import { WorkflowEditorShellProvider } from "./_components/WorkflowEditorShellProvider";
import { WorkflowNodesSidebarLayout } from "./_components/WorkflowNodesSidebarLayout";
import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function WorkflowLayout({ children }: { children: React.ReactNode }) {
    const user = await currentUser();
    const isAuthenticated = !!user?.id;

    if (!isAuthenticated) {
        return (
            <main className={`flex min-h-screen w-full items-center justify-center ${themeClass}`}>
                {children}
            </main>
        );
    }

    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("workflow_sidebar_state")?.value === "true";

    return (
        <main className={`flex h-full w-full min-h-0 ${themeClass} overflow-hidden`}>
            <WorkflowEditorShellProvider>
                <div className="flex-1 min-w-0 min-h-0 overflow-hidden">{children}</div>

                <SidebarProvider defaultOpen={defaultOpen}>
                    <div className="w-[360px] shrink-0 border-l bg-background overflow-hidden">
                        <WorkflowNodesSidebarLayout />
                    </div>
                </SidebarProvider>
            </WorkflowEditorShellProvider>
        </main>
    );
}
