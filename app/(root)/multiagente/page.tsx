import IframeRenderer from "@/components/custom/IframeRenderer";

const MultiagentePage = async () => {
    const url = "https://docs.google.com/spreadsheets/d/1syk8G5IjVHqmJEsxkRf07P6YZgdaJ2_lm5eigiv9Lqo/edit?gid=899504059#gid=899504059";
    
    return <IframeRenderer url={url} />;
}

export default MultiagentePage;
