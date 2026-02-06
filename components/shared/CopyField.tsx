import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export const CopyField = ({ value }: { value: string }) => {
    debugger;
    
    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        toast.success("Copiado");
    };

    return (
        <div className="col-span-3 flex items-center gap-2">
            <Input value={value} readOnly disabled className="flex-1 pr-10" />
            <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
    );
};
