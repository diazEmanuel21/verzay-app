import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { MainReminders } from "../../reminders/_components";
import { MainReminderInterface } from "@/schema/reminder";
import ServiceManager from './services/ServiceManager';
import { CustomCalendar } from "./dashboard"
import { ShareScheduleLinkButton, UserAvailabilityForm } from "./availability"

export const MainSchedule = ({ isCampaignPage, user, apiKey, reminders, leads, workflows, instancia, }: MainReminderInterface) => {
    const userId = user.id;

    return (
        <div className="flex w-full flex-col gap-6">
            <Tabs defaultValue="dashboard">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
                    <TabsTrigger value="services">Servicios</TabsTrigger>
                    <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard">
                    <Card className="border-none pt-6">
                        <CardContent>
                            <CustomCalendar user={user} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="availability">
                    <Card className="border-none mt-2">
                        <CardContent className="flex flex-col pt-6 gap-2">
                            <UserAvailabilityForm userId={userId} />
                            <ShareScheduleLinkButton userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="services">
                    <Card className="border-none">
                        <CardContent className="flex flex-col gap-2 ">
                            <ServiceManager userId={userId} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="reminders">
                    <Card className="border-none">
                        <CardContent className="flex flex-col gap-2 ">
                            <MainReminders
                                isCampaignPage={isCampaignPage}
                                user={user}
                                apiKey={apiKey}
                                reminders={reminders}
                                leads={leads}
                                workflows={workflows}
                                instancia={instancia}
                                isScheduleView={true}
                                isSchedule={true}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}