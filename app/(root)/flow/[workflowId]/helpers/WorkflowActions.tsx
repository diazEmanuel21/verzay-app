import {
    FileText,
    Image as ImageIcon,
    Video,
    File,
    Music,
    AlarmClock
} from "lucide-react";
import { Action } from "../types";

export const actions: Action[] = [
    { type: "text", label: "Texto", icon: <FileText className="h-5 w-5 text-purple-600" /> },
    { type: "image", label: "Imagen", icon: <ImageIcon className="h-5 w-5 text-blue-500" /> },
    { type: "video", label: "Video", icon: <Video className="h-5 w-5 text-red-500" /> },
    { type: "document", label: "Archivo/Documento", icon: <File className="h-5 w-5 text-gray-500" /> },
    { type: "audio", label: "Audio", icon: <Music className="h-5 w-5 text-green-500" /> },
    { type: "delaymsg", label: "Seguimiento", icon: <AlarmClock className="h-5 w-5 text-purple-700" /> },
];