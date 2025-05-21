'use server'

import { currentUser } from "@/lib/auth";
import { MainGuide } from "../(protected)/admin/documentation/guide/_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const DocumentationPage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (!user) return;

    return <MainGuide user={user} />
};

export default DocumentationPage;
