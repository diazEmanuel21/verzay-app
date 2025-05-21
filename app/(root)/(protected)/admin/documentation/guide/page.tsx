'use server'

import { currentUser } from "@/lib/auth";
import { MainGuide } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const GuidePage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    return (
        <MainGuide user={user} />
    );
};

export default GuidePage;

