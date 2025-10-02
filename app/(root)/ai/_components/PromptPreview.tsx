import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { PromptPreviewInterface } from "@/types/agentAi"

export const PromptPreview = ({
    prompt,
}: PromptPreviewInterface) => {
    return (
        <Card className="border-muted/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Vista previa del Prompt (texto plano)</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    readOnly
                    className="min-h-[540px] font-mono text-sm"
                    value={prompt}
                />
                {/* <div className="pt-3 flex justify-end">
                    <Button id="copy-btn-bottom" onClick={copy} variant="secondary" className="gap-2">
                        <Copy className="h-4 w-4" /> Copiar
                    </Button>
                </div> */}
            </CardContent>
        </Card>
    )
}
