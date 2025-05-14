// stores/reminders/reminderDialogStore.ts
import { create } from 'zustand';

type DialogType = 'edit' | 'delete' | 'create' | null;

interface ReminderDialogState {
  openDialog: DialogType;
  selectedReminderId: string | null;
  open: (type: DialogType, id?: string) => void;
  close: () => void;
}

export const useReminderDialogStore = create<ReminderDialogState>((set) => ({
  openDialog: null,
  selectedReminderId: null,
  open: (type, id) => set({ openDialog: type, selectedReminderId: id }),
  close: () => set({ openDialog: null, selectedReminderId: null }),
}));
