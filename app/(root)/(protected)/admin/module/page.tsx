'use server'

import { currentUser } from "@/lib/auth";
import { MainModule } from "./_components";
import AccessDenied from "@/app/AccessDenied";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const ModulePage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (!user || user?.role !== "admin") {
        return <AccessDenied />;
    };

    return (
        <MainModule />
    );
};

export default ModulePage;