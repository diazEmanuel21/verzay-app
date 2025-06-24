import { currentUser } from '@/lib/auth';
import { MainSchedule } from './_components';

// Puedes precargar el asesor para mostrar info contextual
const SchedulePage = async ({ params }: { params: { userId: string } }) => {
    const user = await currentUser();
    if (!user) return null;

    return (
        <MainSchedule userId={user.id} />
    );
};

export default SchedulePage;



