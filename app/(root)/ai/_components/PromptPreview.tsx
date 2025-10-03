import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { PromptPreviewInterface } from "@/types/agentAi"

export const PromptPreview = ({
    prompt,
}: PromptPreviewInterface) => {
    return (
        <Card className="border-muted/60">
            {/* <CardHeader>
                <CardTitle className="text-base"></CardTitle>
            </CardHeader> */}
            <CardContent className="pt-4">
                <Textarea
                    readOnly
                    className="min-h-[540px] font-mono text-sm"
                    value={prompt}
                />
            </CardContent>
        </Card>
    )
}
