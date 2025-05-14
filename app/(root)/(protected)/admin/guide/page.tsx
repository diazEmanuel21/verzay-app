'use server'

import { currentUser } from "@/lib/auth";
import { getAllGuides } from "@/actions/guide-actions";
import { MainGuide } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const GuidePage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (user?.role !== "admin") {
        return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
    };

    const result = await getAllGuides();

    if (!result.data) {
        return <h1>Error al cargar las apikey</h1>;
    };

    return (
        <>
            <MainGuide />
        </>
    );
};

export default GuidePage;

