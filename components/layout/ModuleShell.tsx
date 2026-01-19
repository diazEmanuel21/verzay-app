import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/custom";
import { themeClass } from "@/types/generic";

type Props = {
    children: React.ReactNode;
    padded?: boolean;
    breadcrumbs?: boolean;
    isFlow?: boolean;
};

export default async function ModuleShell({
    children,
    padded = true,
    breadcrumbs = true,
    isFlow,
}: Props) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <SidebarInset className="h-screen flex flex-col min-h-0">
                {breadcrumbs && <div className="shrink-0"><Breadcrumbs isFlow={isFlow} /></div>}

                {padded ? (
                    <main className={`flex-1 min-h-0 overflow-auto p-4 ${themeClass}`}>
                        {children}
                    </main>
                ) : (
                    // ✅ para ReactFlow/editor: sin padding y sin overflow auto aquí
                    <main className={`flex-1 min-h-0 w-full ${themeClass}  overflow-auto`}>
                        {children}
                    </main>
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
