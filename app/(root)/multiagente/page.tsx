import IframeRenderer from "@/components/custom/IframeRenderer";

const MultiagentePage = async () => {
    const url = "https://multiagente.ia-app.com";
    
    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
