'use client'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import { FormInstanceConnectionValues, FormInstanceConnectionSchema } from '@/schema/connection';

interface ConnectionCardInterface {
    userId: string;
    handleSubmit: SubmitHandler<FormInstanceConnectionValues>;
    loading: boolean;
    defaultValues: FormInstanceConnectionValues;
}

export const ConnectionCard = ({ handleSubmit, userId, loading, defaultValues }: ConnectionCardInterface) => {
    const form = useForm<FormInstanceConnectionValues>({
        resolver: zodResolver(FormInstanceConnectionSchema),
        defaultValues,
    });

    return (
        <Card className="border-border max-w-96">
            <CardHeader>
                <CardTitle>Crear instancia</CardTitle>
            </CardHeader>
            <Form {...form}>
                <form id="module-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="instanceName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la Instancia</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Company S.A" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Crear Instancia
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
