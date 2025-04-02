import {
    FileText,
    Image as ImageIcon,
    Video,
    File,
    Music,
} from "lucide-react";

export const actions = [
    { type: "text", label: "Texto", icon: <FileText className="h-5 w-5 text-purple-600" /> },
    { type: "image", label: "Imagen", icon: <ImageIcon className="h-5 w-5 text-blue-500" /> },
    { type: "video", label: "Video", icon: <Video className="h-5 w-5 text-red-500" /> },
    { type: "document", label: "Archivo/Documento", icon: <File className="h-5 w-5 text-gray-500" /> },
    { type: "audio", label: "Audio", icon: <Music className="h-5 w-5 text-green-500" /> },
];