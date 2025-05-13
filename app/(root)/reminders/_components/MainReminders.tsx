import { Suspense } from 'react';
import Header from '@/components/shared/header';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateReminder } from './';
import { ApiKey, User } from '@prisma/client';

const ReminderSkeleton = () => {
  return (
    <div className='space-y-2'>
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className='h-32 w-full' />
      ))}
    </div>
  );
};

export const MainReminders = ({ user, apiKey }: { user: User, apiKey: ApiKey }) => {

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 mb-6">
        <div className="flex justify-between items-center flex-col">
          <Header
            title={'Recordatorios'}
            subtitle={'Agenda recordatorios para tus leads'}
          />
          <CreateReminder userId={user.id} apikey={apiKey.key} serverUrl={apiKey.url} />
        </div>
      </div>

      <Suspense fallback={<ReminderSkeleton />}>
        {/* Scroll interno para el contenido */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {/* <UserWorkflows userId={user.id} /> */}
          </div>
        </div>
      </Suspense>
    </div>
  );
};