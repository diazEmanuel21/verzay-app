import IframeRenderer from "@/components/custom/IframeRenderer";

const MultiagentePage = async () => {
    const url = "https://conexion-1.verzay.co/manager/";
    
    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
