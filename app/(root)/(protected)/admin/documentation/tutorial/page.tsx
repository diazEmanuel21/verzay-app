'use server'

import { MainTutorial } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const TutorialPage = async ({ searchParams }: Props) => {

    return (
        <MainTutorial />
    );
};

export default TutorialPage;

