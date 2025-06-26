
import { AppWindowIcon, CodeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { currentUser } from '@/lib/auth';
import { UserAvailabilityForm } from './';
import AppointmentDashboard from './AppointmentDashboard';
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
                        <Card className="border-none">
                            <CardHeader>
                                <CardTitle>Dashboard</CardTitle>
                                {/* <CardDescription>
                                    Make changes to your dashboard here. Click save when you&apos;re
                                    done.
                                </CardDescription> */}
                            </CardHeader>
                            <CardContent className="grid gap-6">

                                <AppointmentDashboard userId={userId} />

                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="availability">
                        <Card className="border-none">
                            <CardHeader>
                                <CardTitle>Disponibilidad</CardTitle>
                                {/* <CardDescription>
                                    Change your availability here. After saving, you&apos;ll be logged
                                    out.
                                </CardDescription> */}
                                <ShareScheduleLinkButton userId={userId} />
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <UserAvailabilityForm userId={userId} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}