import { useReminderDialogStore } from './reminderDialogStore';

export const openEditDialog = (id: string) => {
    useReminderDialogStore.getState().open('edit', id);
};

export const openDeleteDialog = (id: string) => {
    useReminderDialogStore.getState().open('delete', id);
};

export const closeDialog = () => {
    useReminderDialogStore.getState().close();
};
