import { currentUser } from "@/lib/auth";
import { getResellerProfileForUser } from "@/actions/reseller-action";
import { getAllModules } from "@/actions/module-actions";
import AppInitializer from "@/components/custom/AppInitializer";
import { themeClass } from "@/types/generic";
import ModuleShell from "@/components/layout/ModuleShell";

export default async function WorkflowLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();
    const isAuthenticated = !!user?.id;

    if (!isAuthenticated) {
        return (
            <main className={`flex min-h-screen w-full items-center justify-center ${themeClass}`}>
                {children}
            </main>
        );
    }

    const onReseller = await getResellerProfileForUser(user.id);
    const modules = (await getAllModules()).data ?? [];


    return (
        <main className={`flex min-h-screen w-full flex-col ${themeClass}`}>
            <AppInitializer onReseller={onReseller} modules={modules} user={user} />

            <ModuleShell padded={false} breadcrumbs>
                {children}
            </ModuleShell>
        </main>
    );
}