import { useReminderDialogStore } from './reminderDialogStore';

export const openCreateDialog = () => {
    useReminderDialogStore.getState().open('create');
};

export const openEditDialog = (id: string) => {
    useReminderDialogStore.getState().open('edit', id);
};

export const openDeleteDialog = (id: string) => {
    useReminderDialogStore.getState().open('delete', id);
};

export const closeDialog = () => {
    useReminderDialogStore.getState().close();
};
