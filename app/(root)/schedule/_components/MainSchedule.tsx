import { currentUser } from '@/lib/auth';
import { UserAvailabilityForm } from './';
import AppointmentDashboard from './AppointmentDashboard';

export const MainSchedule = ({ userId }: { userId: string }) => {

    return (
        <>
            <div className="p-6 max-w-3xl mx-auto">
                <UserAvailabilityForm userId={userId} />
            </div>
            <div className="p-6">
                <AppointmentDashboard userId={userId} />
            </div>
        </>
    )
}
