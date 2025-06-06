'use server'

import { currentUser } from "@/lib/auth";
import { MainDocumentation } from "./_components";
import AccessDenied from "@/app/AccessDenied";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const DocumentationPage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (!user || user?.role !== "admin") {
        return <AccessDenied />;
    };

    return (
        <MainDocumentation />
    );
};

export default DocumentationPage;

