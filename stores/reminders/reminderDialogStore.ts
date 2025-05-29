// stores/reminders/reminderDialogStore.ts
import { Reminders } from '@prisma/client';
import { create } from 'zustand';

type DialogType = 'edit' | 'delete' | 'create' | null;

interface ReminderDialogState {
  openDialog: DialogType;
  selectedReminderId: string | null;
  reminderData: Reminders | null;
  open: (type: DialogType, id?: string, reminder?: Reminders) => void;
  close: () => void;
}

export const useReminderDialogStore = create<ReminderDialogState>((set) => ({
  openDialog: null,
  selectedReminderId: null,
  reminderData: null,
  open: (type, id, reminder) => set({ openDialog: type, selectedReminderId: id, reminderData: reminder }),
  close: () => set({ openDialog: null, selectedReminderId: null, reminderData: null }),
}));