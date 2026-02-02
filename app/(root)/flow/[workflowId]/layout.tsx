import ModuleShell from "@/components/layout/ModuleShell";
import { currentUser } from "@/lib/auth";
import { themeClass } from "@/types/generic";

import '@xyflow/react/dist/style.css';

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

    return (
        <main className={`flex min-h-screen w-full flex-col ${themeClass}`}>
            {children}
        </main>
    );
}