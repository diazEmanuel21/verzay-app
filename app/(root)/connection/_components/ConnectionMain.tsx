'use client'

import { Instancias, User } from '@prisma/client';
import { ClientInstanceCard } from './';

export const ConnectionMain = ({ user, instance }: { user: User, instance?: Instancias }) => {
    return (
        <>
            {
                instance
                    ? <h1>Not found instance</h1>
                    : <ClientInstanceCard
                        intanceName={'Dasilrod Multitienda'}
                        user={user}
                        intanceNumber={'584129109044'}
                        connected={true}
                        messages={21610}
                        contacts={2444}
                        apiKey={'58013451-9DC4-4306-8594-1A2E8267232C'}
                    />
            }
        </>
    )
}
