// import { currentUser } from '@/lib/auth';
// import { redirect } from 'next/navigation';
// import { getNodeforUser, getWorkflowEdges } from '@/actions/workflow-node-action';
// import { ReactFlowProvider } from '@xyflow/react';

// import { WorkflowEditorClient } from './_components';

// const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
//   const user = await currentUser();
//   if (!user) {
//     redirect('/login');
//   }

//   const { workflowId } = params;

//   const nodes = await getNodeforUser(workflowId);
//   const edgesDB = await getWorkflowEdges(workflowId);

//   return (
//     <div className="flex flex-col flex-1 w-full min-h-0 h-[95vh]">
//       <ReactFlowProvider>
//         <div className="flex flex-col w-full h-full min-h-0">
//           <div className="flex-1 min-h-0 flex w-full">
//             <WorkflowEditorClient
//               nodesDB={nodes}
//               edgesDB={edgesDB.data}
//               workflowId={workflowId}
//               user={user}
//             />
//           </div>
//         </div>
//       </ReactFlowProvider>
//     </div>
//   );
// };

// export default CustomWorkflow;


import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNodeforUser, getWorkflowEdges } from '@/actions/workflow-node-action';
import { ReactFlowProvider } from '@xyflow/react';

import Link from 'next/link';

// shadcn
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// icons
import { Wrench, Sparkles, ShieldCheck, ArrowLeft, RefreshCcw, Clock } from 'lucide-react';

// import { WorkflowEditorClient } from './_components';

const CustomWorkflow = async ({ params }: { params: { workflowId: string } }) => {
  const user = await currentUser();
  if (!user) redirect('/login');

  const { workflowId } = params;

  // Mantengo tus llamadas tal cual (por si las necesitas para validar existencia, etc.)
  const nodes = await getNodeforUser(workflowId);
  const edgesDB = await getWorkflowEdges(workflowId);

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 h-[95vh]">
      {/* Editor en pausa (mantenimiento) */}
      {/* <ReactFlowProvider>
        <div className="flex flex-col w-full h-full min-h-0">
          <div className="flex-1 min-h-0 flex w-full">
            <WorkflowEditorClient
              nodesDB={nodes}
              edgesDB={edgesDB.data}
              workflowId={workflowId}
              user={user}
            />
          </div>
        </div>
      </ReactFlowProvider> */}

      {/* Mantenimiento UI */}
      <div className="flex-1 min-h-0 w-full">
        <div className="mx-auto h-full w-full max-w-5xl px-4 md:px-8 py-6 md:py-10">
          {/* Top bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border-border bg-background/60 p-3 shadow-sm">
                <Wrench className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                    Módulo de Workflows en mantenimiento
                  </h1>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Temporal
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  Estamos trabajando en mejoras para el editor avanzado. Gracias por tu paciencia.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/profile">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al dashboard
                </Link>
              </Button>

              <Button
                variant="default"
                className="gap-2"
                disabled
              >
                <RefreshCcw className="h-4 w-4" />
                Recargar
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main card */}
            <Card className="md:col-span-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  ¿Qué estamos mejorando?
                </CardTitle>
                <CardDescription>
                  Estamos ajustando estabilidad, UI y ejecución para que el editor sea más confiable.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Tu información está segura
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Este mantenimiento no elimina tus workflows. Solo pausamos el editor mientras desplegamos cambios.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border-border p-4">
                    <p className="text-sm font-medium">✅ Mejoras de rendimiento</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optimización de carga de nodos/edges y render.
                    </p>
                  </div>

                  <div className="rounded-xl border-border p-4">
                    <p className="text-sm font-medium">✅ Validaciones y reglas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reglas más estrictas para evitar flujos duplicados o inválidos.
                    </p>
                  </div>

                  <div className="rounded-xl border-border p-4">
                    <p className="text-sm font-medium">✅ UX del editor</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sidebar, handles y acciones más claras y consistentes.
                    </p>
                  </div>

                  <div className="rounded-xl border-border p-4">
                    <p className="text-sm font-medium">✅ Estabilidad de ejecución</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajustes para ejecución confiable en backend.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border-border p-4">
                  <p className="text-sm font-medium">ID del Workflow</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{workflowId}</p>
                </div>
              </CardContent>
            </Card>

            {/* Side status */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Estado</CardTitle>
                <CardDescription>Información rápida del módulo</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Editor</p>
                    <Badge variant="secondary">Pausado</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Nodos</p>
                    <p className="text-sm font-medium">{Array.isArray(nodes) ? nodes.length : 0}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Conexiones</p>
                    <p className="text-sm font-medium">
                      {Array.isArray(edgesDB?.data) ? edgesDB.data.length : 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/workflow">Ir a lista de workflows</Link>
                  </Button>

                  <Button asChild className="w-full">
                    <Link href="/flow">Usar módulo básico (Flows)</Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Tip: Si necesitas ejecutar un flujo rápido mientras tanto, usa <span className="font-medium">Flows</span>.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-xs text-muted-foreground">
            <span className="font-medium">Nota:</span> Este es un diseño temporal. Cuando se habilite el editor, este layout se reemplaza automáticamente.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomWorkflow;
