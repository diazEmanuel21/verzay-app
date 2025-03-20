import MobileNav from '@/components/shared/MobileNav'
import Sidebar from '@/components/shared/Sidebar'
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import React from 'react'

const layout = async({ children }: {children: React.ReactNode}) => {
  const session = await currentUser();

  const user = await db.user.findUnique({
    where: { email: session?.email ?? "" },
  });

  if (!user) {
    return <div>No estás autenticado</div>;
  }

  return (
    <div>
      <main className='root'>
          <Sidebar userInformation={user}/>
          <MobileNav userInformation={user}/>
          {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
        <div className='root-container'>
            <div className="wrapper">
                {children}
            </div>
        </div>
      </main>
    </div>
  )
}

export default layout
