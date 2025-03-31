import {
    FileText,
    Image as ImageIcon,
    Video,
    File,
    Music,
} from "lucide-react";

export const actions = [
    { label: "Texto", icon: <FileText className="h-5 w-5 text-purple-600" /> },
    { label: "Imagen", icon: <ImageIcon className="h-5 w-5 text-blue-500" /> },
    { label: "Video", icon: <Video className="h-5 w-5 text-red-500" /> },
    { label: "Archivo/Documento", icon: <File className="h-5 w-5 text-gray-500" /> },
    { label: "Audio", icon: <Music className="h-5 w-5 text-green-500" /> },
];