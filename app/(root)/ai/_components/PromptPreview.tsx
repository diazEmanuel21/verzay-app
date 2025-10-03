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
            </CardContent>
        </Card>
    )
}
