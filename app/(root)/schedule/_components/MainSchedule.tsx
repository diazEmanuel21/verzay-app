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
import { CustomCalendar, UserAvailabilityForm } from './';
import { ShareScheduleLinkButton } from './ShareScheduleLinkButton';

export const MainSchedule = ({ userId }: { userId: string }) => {

    return (
        <>
            <div className="flex w-full flex-col gap-6">
                <Tabs defaultValue="dashboard">
                    <TabsList>
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard">
                        <Card className="border-none pt-6">
                            <CardContent>
                                <CustomCalendar userId={userId} />
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
                </Tabs>
            </div>
        </>
    )
}