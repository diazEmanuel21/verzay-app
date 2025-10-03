import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { PromptPreviewInterface } from "@/types/agentAi"

export const PromptPreview = ({
    prompt,
}: PromptPreviewInterface) => {
    return (
        <Card className="border-none bg-transparent0">
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
