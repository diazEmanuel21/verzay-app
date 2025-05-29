'use client'

import { reminderListClientInterface } from "@/schema/reminder";
import { ReminderList } from "./";

export const ReminderListClient = ({ workflows, filteredReminders }: reminderListClientInterface) => {
    return (
        <>
            {filteredReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-8">
                    No se encontraron recordatorios.
                </p>
            ) : (
                <>
                    {filteredReminders.map((reminder) => {
                        const workflow = workflows.find(w => w.id === reminder.workflowId);

                        return (
                            <ReminderList
                                key={reminder.id}
                                reminder={reminder}
                                workflow={workflow}
                            />
                        );
                    })}
                </>
            )}
        </>
    )
}