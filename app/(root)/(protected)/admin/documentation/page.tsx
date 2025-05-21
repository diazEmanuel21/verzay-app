'use server'

import { MainDocumentation } from "./_components";

interface Props {
    searchParams: { [key: string]: string | undefined }
}

const DocumentationPage = async ({ searchParams }: Props) => {

    return (
        <MainDocumentation />
    );
};

export default DocumentationPage;

