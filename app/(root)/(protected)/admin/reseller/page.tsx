'use server'

import { currentUser } from "@/lib/auth";
import { obtenerApiKeys } from "@/actions/api-action";
import { MainReseller } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const ResellerPage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (user?.role !== "admin") {
        return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
    };


    return (
        <>
            <MainReseller searchParams={searchParams} user={user} />
        </>
    );
};

export default ResellerPage;

