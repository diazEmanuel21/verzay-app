import { cookies } from "next/headers";

import { requireAuth } from "@/lib/require-auth";
import { currentUser } from "@/lib/auth";
import { getResellerProfileForUser } from "@/actions/reseller-action";
import { getAllModules } from "@/actions/module-actions";

import AppInitializer from "@/components/custom/AppInitializer";
import AppSkeleton from "@/components/custom/AppSkeleton";
import { Breadcrumbs } from "@/components/custom";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { themeClass } from "@/types/generic";

export default async function RootGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    const user = await currentUser();
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    const onReseller = await getResellerProfileForUser(user!.id);
    const modules = (await getAllModules()).data ?? [];

    const loading = !user || modules.length === 0;
    if (loading) return <AppSkeleton />;

    return (
        <>
            <AppInitializer onReseller={onReseller} modules={modules} user={user} />
            <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar user={user} />
                <SidebarInset className="h-screen flex flex-col">
                    <Breadcrumbs />
                    <main className={`flex-1 overflow-auto p-4 ${themeClass}`}>
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}