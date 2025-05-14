'use client'

import { Suspense, useState } from 'react';
import Header from '@/components/shared/header';
import { CreateReminder, ReminderList } from './';
import { ApiKey, Reminders, User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

const ReminderSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  )
};

export const MainReminders = ({ user, apiKey, reminders }: { user: User, apiKey: ApiKey, reminders: Reminders[] }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 mb-6">
        <div className="flex justify-between items-center">
          <Header
            title={'Recordatorios'}
            subtitle={'Agenda recordatorios para tus leads'}
          />

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="p-0 w-[420px] max-w-[90vw]"
            >
              <Card className="p-2">
                <CreateReminder
                  userId={user.id}
                  apikey={apiKey.key}
                  serverUrl={apiKey.url}
                  onSuccess={() => setOpen(false)} // para cerrar al crear
                />
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Scroll interno para el contenido */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="grid grid-cols-1 gap-2 p-2">
          <Suspense fallback={<ReminderSkeleton />}>
            <ReminderList reminders={reminders} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};