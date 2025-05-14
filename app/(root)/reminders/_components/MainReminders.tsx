'use client'

import { Suspense, useEffect, useMemo, useState } from 'react';
import Header from '@/components/shared/header';
import { CreateReminder, ReminderListClient, CreateReminderSkeleton, ReminderSkeleton } from './';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, PlusIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mainReminderInterface } from '@/schema/reminder';
import { Input } from '@/components/ui/input';
import { useReminderDialogStore } from '@/stores';

export const MainReminders = ({ user, apiKey, reminders, leads, workflows }: mainReminderInterface) => {
  const { openDialog, selectedReminderId } = useReminderDialogStore();

  useEffect(() => {
    console.log({ openDialog })
  }, [openDialog])

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredReminders = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => {
      return sortAsc
        ? new Date(a.time).getTime() - new Date(b.time).getTime()
        : new Date(b.time).getTime() - new Date(a.time).getTime()
    })

    return sorted.filter((r) => {
      const fullText = `${r.title} ${r.description ?? ""} ${r.pushName} ${r.remoteJid}`.toLowerCase()
      return fullText.includes(search.toLowerCase())
    })
  }, [reminders, search, sortAsc]);

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo */}
      <div className="sticky top-0 z-1 mb-2">
        <div className="flex flex-col overflow-hidden justify-between flex-1 gap-4 p-2">
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
                <Suspense fallback={<CreateReminderSkeleton />}>
                  <CreateReminder
                    userId={user.id}
                    apikey={apiKey.key}
                    leads={leads}
                    workflows={workflows}
                    serverUrl={apiKey.url}
                    onSuccess={() => setOpen(false)} // para cerrar al crear
                  />
                </Suspense>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-row gap-2 items-center justify-start">
            <Input
              placeholder="Buscar por título, número o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:max-w-sm"
            />

            <Button
              variant="ghost"
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-2"
            >
              <ArrowDownUp className="h-4 w-4" />
              <span className="hidden md:inline">
                {sortAsc ? "Más recientes primero" : "Más antiguos primero"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll interno para el contenido */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2 xl:grid-cols-3">
          <Suspense fallback={<ReminderSkeleton />}>
            <ReminderListClient
              filteredReminders={filteredReminders}
              workflows={workflows}
            />
          </Suspense>
        </div>
      </div>
      {/* <EditReminderDialog
        open={openDialog === 'edit'}
        reminderId={selectedReminderId}
        onClose={closeDialog}
      />
      <DeleteReminderDialog
        open={openDialog === 'delete'}
        reminderId={selectedReminderId}
        onClose={closeDialog}
      /> */}
    </div>
  );
};