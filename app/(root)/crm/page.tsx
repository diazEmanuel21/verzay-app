// app/(dashboard)/crm/page.tsx
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainCrm } from "./components/MainCrm";

interface PageProps {
    params: { id?: string };
    searchParams: { [key: string]: string | string[] | undefined };
}

const CrmPage = async ({ searchParams }: PageProps) => {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    // si quieres filtrar por ?status=true/false en la URL:
    const rawStatus = searchParams.status;
    const status =
        rawStatus === "true"
            ? true
            : rawStatus === "false"
                ? false
                : undefined;

    return (
        <>
            <MainCrm userId={user.id} status={status} />
        </>
    );
};

export default CrmPage;
