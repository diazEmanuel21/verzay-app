import { currentUser } from "@/lib/auth";
import { getResellerProfileForUser } from "@/actions/reseller-action";
import { getAllModules } from "@/actions/module-actions";

import AppInitializer from "@/components/custom/AppInitializer";
import { themeClass } from "@/types/generic";

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
        <div className={`h-screen w-screen overflow-hidden ${themeClass} p-6`}>
            <AppInitializer onReseller={onReseller} modules={modules} user={user} />
            {children}
        </div>
    );
}
