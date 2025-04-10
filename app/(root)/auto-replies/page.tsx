import { currentUser } from '@/lib/auth';
import { GetWorkFlowforUser } from '@/actions/getWorkFlowforUser-action';
import { Workflow } from '@prisma/client';
import { Suspense } from 'react';
import { AutoRepliesContent, SkeletonAutoReplies } from './_components';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

function hasWorkflow(result: { data?: Workflow[] }): result is { data: Workflow[] } {
    return !!result.data;
}

const AutoRepliesPage = async () => {

    const user = await currentUser();

    if (!user) {
        return <h1 className="text-center text-2xl font-bold mt-10">404 - Usuario no autorizado</h1>;
    }

    const resWorkflow = await GetWorkFlowforUser(user.id);
    const workflows = hasWorkflow(resWorkflow) ? resWorkflow.data : [];

    if (user) {
        return (
            <div className="flex justify-center">
                <Card className="w-full max-w-xl shadow-xl">
                    <CardContent className="flex flex-col items-center text-center p-8">
                        <Sparkles className="w-10 h-10 text-purple-500 animate-pulse mb-4" />
                        <h1 className="text-2xl font-bold mb-2">
                            🚧 ¡Algo increíble está por llegar!
                        </h1>
                        <p className="text-muted-foreground text-sm mb-4">
                            Estamos desarrollando una nueva funcionalidad de <b>respuesta rápida</b> con envío de archivos adjuntos, además de <b>seguimientos inteligentes</b> impulsados por inteligencia artificial que conservan el contexto    .
                            <br /><br />
                            Muy pronto tendrás acceso a herramientas que potenciaran tu negocio como nunca antes lo habia experimentado..
                        </p>
                        <span className="text-xs text-gray-400">Verzay a tu servicio. 2025 💜</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Suspense fallback={<SkeletonAutoReplies />}>
            <AutoRepliesContent user={user} workflows={workflows} />
        </Suspense>
    );
};

export default AutoRepliesPage;
