import { Columns } from './Columns';
import { DataGrid } from './DataGrid';
import { Session } from "@prisma/client";

interface MainSessionProps {
    sessions: Session[];
}

export const MainSession = ({ sessions }: MainSessionProps) => {
    return (
        <DataGrid<Session, unknown> columns={Columns} data={sessions} />
    )
};