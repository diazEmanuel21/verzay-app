import IframeRenderer from "@/components/custom/IframeRenderer";

const MultiagentePage = async () => {
    const url = "https://multiagente.verzay.co";
    
    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
