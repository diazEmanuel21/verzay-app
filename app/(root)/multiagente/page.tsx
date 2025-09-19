"use client";

const MultiagentePage = () => {
    const url = "https://multiagente.ia-app.com";

    return (
        <iframe
            src={url}
            allow="microphone; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
        />
    );
};

export default MultiagentePage; 