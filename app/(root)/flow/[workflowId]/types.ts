export type ActionType = "text" | "image" | "video" | "document" | "audio" | "delaymsg";

export interface Action {
    type: ActionType;
    label: string;
    icon: JSX.Element;
};