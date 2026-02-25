import AccessDenied from "@/app/AccessDenied";
import IframeRenderer from "@/components/custom/IframeRenderer";
import { currentUser } from "@/lib/auth";

const MultiagentePage = async () => {
    const user = await currentUser();
    const url = "https://evoapi1.ia-app.com/manager";

    if (!user || user?.role !== "admin") {
        return <AccessDenied />;
    };

    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
