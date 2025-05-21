'use server'

import { currentUser } from "@/lib/auth";
import { MainTutorial } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const TutorialPage = async ({ searchParams }: Props) => {
    const user = await currentUser();

    if (!user || user?.role !== "admin") {
        return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
    };


    return (
        <MainTutorial />
    );
};

export default TutorialPage;

