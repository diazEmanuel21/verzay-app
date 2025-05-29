// app/iframe/IframeRenderer.tsx
'use client';

interface Props {
    url: string | null;
}

export default function IframeRenderer({ url }: Props) {
    if (!url) {
        return <div className="text-red-500">Error al cargar el iframe.</div>;
    }

    return (
        <iframe
            src={url}
            className="w-full h-full border-0"
            allow="fullscreen"
        />
    );
}
