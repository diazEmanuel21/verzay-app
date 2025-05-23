import { currentUser } from '@/lib/auth';
import { ConnectionMain } from './_components';

const ConnectionPage = async () => {
    const user = await currentUser();

    if (!user) {
        return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autenticado</h1>;
    }


    console.log({user});
    return (
        <>
            <h1>hola</h1>
        </>
        // <ConnectionMain user={user}/>
    )
}

export default ConnectionPage