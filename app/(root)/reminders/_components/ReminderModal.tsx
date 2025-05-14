// components/reminders/ReminderModal.tsx
"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useReminderDialogStore, closeDialog } from "@/stores"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Suspense } from "react"
import { CreateReminder, CreateReminderSkeleton } from "./"
import { ApiKey, Session, Workflow, User } from "@prisma/client"

interface ReminderModalProps {
    user: User
    apiKey: ApiKey
    leads: Session[]
    workflows: Workflow[]
}

export const ReminderModal = ({ user, apiKey, leads, workflows }: ReminderModalProps) => {
    const { openDialog } = useReminderDialogStore()

    return (
        <AnimatePresence>
            {(openDialog === 'edit' || openDialog === 'create') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-md p-2"
                    >
                        <Card className="relative shadow-2xl border border-border rounded-2xl bg-background">
                            <CardHeader className="flex items-center justify-between flex-row">
                                <CardTitle>
                                    {openDialog === 'edit' ? "Editar Recordatorio" : "Crear Recordatorio"}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => closeDialog()}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Suspense fallback={<CreateReminderSkeleton />}>
                                    <CreateReminder
                                        userId={user.id}
                                        apikey={apiKey.key}
                                        serverUrl={apiKey.url}
                                        leads={leads}
                                        workflows={workflows}
                                        onSuccess={() => closeDialog()}
                                    />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}