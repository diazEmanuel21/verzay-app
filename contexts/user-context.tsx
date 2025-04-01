'use client';

import { createContext, useContext } from 'react';
import { User } from '@prisma/client';

type UserContextType = {
  user: User | null;
};

const UserContext = createContext<UserContextType>({
  user: null,
});

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);