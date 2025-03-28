import { transformationTypes } from '@/constants';
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { SessionComponent } from './_components';

// Define un tipo literal que coincida con las claves de transformationTypes
type TransformationTypeKeys = keyof typeof transformationTypes;

interface SearchParamProps {
    params: {
        type: TransformationTypeKeys; // Usa el tipo literal aquí
    };
}

const SessionsPage = async ({ params: { type } }: SearchParamProps) => {
    const session = await currentUser();

    const user = await db.user.findUnique({
        where: { email: session?.email ?? "" }
    });

    if (!user) {
        return <div>Not authenticated</div>;
    }

    return (
        <>
            {/* <SessionComponent userId/> */}
        </>
    );
}

export default SessionsPage;
