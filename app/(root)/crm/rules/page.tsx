// app/(dashboard)/crm/dashboard/page.tsx
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainCrmRules } from "./components";

const CrmRulesPage = async () => {
    const user = await currentUser();
    if (!user) redirect("/login");

    return <MainCrmRules userId={user.id} />;
};

export default CrmRulesPage;
