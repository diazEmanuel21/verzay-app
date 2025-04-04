import {
    FileText,
    Image as ImageIcon,
    Video,
    File,
    Music,
    AlarmClock,
} from "lucide-react";
import { Action } from "../types";

const iconSize = 'h-5 w-5';
const stylesSeguimiento = 'text-purple-700';

// Acciones principales (incluyendo "seguimiento" como categoría)
export const baseActions: Action[] = [
    { type: "text", label: "Texto", icon: <FileText className={`${iconSize} text-purple-600`} /> },
    { type: "image", label: "Imagen", icon: <ImageIcon className={`${iconSize} text-blue-500`} /> },
    { type: "video", label: "Video", icon: <Video className={`${iconSize} text-red-500`} /> },
    { type: "document", label: "Documento", icon: <File className={`${iconSize} text-gray-500`} /> },
    { type: "audio", label: "Audio", icon: <Music className={`${iconSize} text-green-500`} /> },
    { type: "seguimiento", label: "Seguimiento", icon: <AlarmClock className={`${iconSize} ${stylesSeguimiento}`} /> }, // Categoría padre
];

// Acciones de seguimiento (sub-tipos)
export const seguimientoActions: Action[] = [
    { type: "seguimiento-text", label: "Texto", icon: <FileText className={`${iconSize} ${stylesSeguimiento}`} /> },
    { type: "seguimiento-image", label: "Imagen", icon: <ImageIcon className={`${iconSize} ${stylesSeguimiento}`} /> },
    { type: "seguimiento-video", label: "Video", icon: <Video className={`${iconSize} ${stylesSeguimiento}`} /> },
    { type: "seguimiento-document", label: "Documento", icon: <File className={`${iconSize} ${stylesSeguimiento}`} /> },
    { type: "seguimiento-audio", label: "Audio", icon: <Music className={`${iconSize} ${stylesSeguimiento}`} /> },
];