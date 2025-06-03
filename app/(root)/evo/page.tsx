import IframeRenderer from "@/components/custom/IframeRenderer";
import { currentUser } from "@/lib/auth";

const MultiagentePage = async () => {
    const user = await currentUser();
    const url = "https://conexion-1.verzay.co/manager/";

    if (!user || user?.role !== "admin") {
        return <div>Lo sentimos este portal solo esta hecho para distruibudores.</div>;
    };

    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
