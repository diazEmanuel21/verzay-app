import { MessageSquareIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { ChangeEvent } from "react";

interface genericTextarea {
    isEditing: boolean
    isPending: boolean
    fileType: string
    message: string
    handleSave: () => void
    setIsEditing: (isEditing: boolean) => void
    setMessage: (e: ChangeEvent<HTMLTextAreaElement>) => void
}

export const GenericTextarea = ({ isEditing, message, handleSave, setIsEditing, setMessage, isPending, fileType }: genericTextarea) => {
    const isTextFile = fileType === 'text';

    return (
        <>
            {
                isEditing ? (
                    <Textarea
                        value={message}
                        onChange={setMessage}
                        onBlur={handleSave}
                        rows={3}
                        autoFocus
                        disabled={isPending}
                        className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary
                            sm:text-base
                            md:rounded-xl
                            lg:p-4
                            resize-y min-h-[120px]"
                    />
                ) : (
                    <div
                        className="w-full flex items-start gap-3 p-3 text-sm cursor-pointer hover:bg-muted/50
                            border border-muted-foreground/20 rounded-lg bg-muted transition-all
                            sm:text-base
                            md:p-4 md:rounded-xl
                            lg:gap-4"
                        onClick={() => setIsEditing(true)}
                    >
                        {isTextFile && <MessageSquareIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                        <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                            {message || <span className="italic text-muted-foreground/50">Click para editar...</span>}
                        </span>
                    </div>
                )
            }
        </>
    )
}
