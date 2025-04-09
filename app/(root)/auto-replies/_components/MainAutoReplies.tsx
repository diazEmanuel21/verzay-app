import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { User, Workflow } from '@prisma/client';

interface props {
    user: User
    Workflows: Workflow[]
}

export const MainAutoReplies = ({ user, Workflows }: props) => {
    return (
        <div className="flex flex-col items-center justify-center">
            <h1>USUARIO</h1>
            {JSON.stringify(user)}
            <h1>FLUJOS</h1>
            {JSON.stringify(Workflows)}
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Crear respuesta rapida</CardTitle>
                    <CardDescription>Crea una respuesta rapida para tu flujo</CardDescription>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Palabra para ejecutar respuesta rapida <strong>(Obligatorio)</strong> </Label>
                                <Input id="name" placeholder="Ya le envío los bonais" />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="framework">Seleccione el flujo <strong>(Obligatorio)</strong> </Label>
                                <Select>
                                    <SelectTrigger id="framework">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="next">Next.js</SelectItem>
                                        <SelectItem value="sveltekit">SvelteKit</SelectItem>
                                        <SelectItem value="astro">Astro</SelectItem>
                                        <SelectItem value="nuxt">Nuxt.js</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button className="w-full">Iniciar</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
