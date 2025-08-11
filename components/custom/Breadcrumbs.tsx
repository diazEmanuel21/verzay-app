'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '../ui/sidebar';
import { useEffect, useState } from 'react';
import { getGuidesForPath } from '@/actions/guide-actions';
import { GuidesUrl } from '@prisma/client';

const breadcrumbLabels: Record<string, string> = {
  flow: 'flujos',
  profile: 'perfil',
  sessions: 'Leads',
  credits: 'planes',
  tools: 'herramientas',
  connection: 'conexiones',
  workflow: 'workflow',
  ai: 'ia',
  'auto-replies': 'Respuestas rápidas',
  reseller: 'afiliados',
  reminders: 'recordatorios',
  tutorial: 'tutoriales',
  guide: 'guías',
  documentation: 'documentación',
  module: 'módulos',
  templates: 'plantillas',
  schedule: 'agendamiento'
};

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const [guides, setGuides] = useState<GuidesUrl[]>([]);

  const isToolRoute = pathname.startsWith('/tools');
  const isMultiAgentRoute = pathname === '/multiagente';

  useEffect(() => {
    const fetchGuides = async () => {
      const currentPath = pathname;
      const data = await getGuidesForPath(currentPath);
      setGuides(data);
    };

    if (segments.length > 0) fetchGuides();
  }, [pathname]);

  // Dividimos la ruta en segmentos y eliminamos strings vacías
  const segments = pathname.split('/').filter((segment) => segment !== '');

  // Generamos el array de breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');

    // Reemplazamos si está en el diccionario
    const labelFromDict = breadcrumbLabels[segment];

    // Detectamos si es un ID por longitud (puedes ajustar la lógica)
    const isId = segment.length > 100;
    const label = labelFromDict || (isId ? 'URL' : decodeURIComponent(segment.replace(/-/g, ' ')));

    return { href, label };
  });

  return (
    <>
      {!isToolRoute && !isMultiAgentRoute ?
        <div className="h-18 shrink-0">
          <header className={`sticky top-0 h-12 w-full border-border flex items-center px-4 bg-gray-100 dark:bg-transparent dark:text-white py-4`}>
            {/* <Breadcrumb className='py-4 flex flex-row flex-1 overflow-hidden bg-slate-100 text-black dark:bg-gray-900 dark:text-white border-border'> */}
            <Breadcrumb className=' flex flex-row flex-1 overflow-hidden bg-gray-100 dark:bg-transparent dark:text-white'>
              {/* <BreadcrumbList> */}
              {/* <BreadcrumbList className="flex flex-wrap items-center gap-1"> */}
              <BreadcrumbList>
                <SidebarTrigger className="-ml-1" />
                {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
                {/* Home link */}
                {/* <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <HomeIcon className="h-5" />
                      <span className="sr-only">Home</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem> */}

                {/* Separador inicial */}
                {breadcrumbs.length > 0 && <BreadcrumbSeparator />}

                {/* Si hay muchos segmentos, mostramos un BreadcrumbEllipsis */}
                {/* {breadcrumbs.length > 3 && (
                  <>
                    <BreadcrumbEllipsis />
                    <BreadcrumbSeparator />
                    {breadcrumbs.slice(-2).map((breadcrumb, index) => (
                      <div key={breadcrumb.href} className="flex items-center">
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link
                              href={breadcrumb.href}
                              className={`capitalize ${index === breadcrumbs.length - 1 ? 'text-primary' : 'text-muted-foreground'
                                } hover:text-primary transition`}
                            >
                              {breadcrumb.label}
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index !== breadcrumbs.slice(-2).length - 1 && <BreadcrumbSeparator />}
                      </div>
                    ))}
                  </>
                )} */}

                {/* Si no hay muchos segmentos, mostramos todos */}
                {/* {breadcrumbs.length <= 3 &&
                  breadcrumbs.map((breadcrumb, index) => (
                    <div key={breadcrumb.href} className="flex items-center">
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            href={breadcrumb.href}
                            className={`capitalize ${index === breadcrumbs.length - 1 ? 'text-primary' : 'text-muted-foreground'
                              } hover:text-primary transition`}
                          >
                            {breadcrumb.label}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>

                      {index !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))} */}
              </BreadcrumbList>

              {/* Tutorials */}
              {/* {guides.length > 0 && (
                <div className='flex justify-end flex-1'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="bg-[#FF0033] hover:bg-[#e60000] text-white font-semibold transition duration-200 uppercase"
                      >
                        <Play className="h-4 w-4 text-white" />
                        <span className="hidden sm:inline">Ver tutoriales</span>
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-xl sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>🎓 Tutoriales del módulo</DialogTitle>
                        <DialogDescription>
                          Aprende a usar cada función con estos tutoriales.
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[60vh] pr-2">
                        <ul className="space-y-4 mt-4">
                          {guides.map((guide) => (
                            <li
                              key={guide.id}
                              className="border rounded-lg p-5 shadow-sm transition cursor-pointer group"
                              onClick={() => window.open(guide.url, '_blank')}
                            >
                              <h3 className="text-base font-semibold text-foreground transition">
                                {guide.title}
                              </h3>

                              <Button
                                className="mt-3 bg-[#FF0033] hover:bg-[#e60000] text-white font-semibold transition duration-200 uppercase px-4 py-2 text-sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Evita doble apertura
                                  window.open(guide.url, '_blank');
                                }}
                              >
                                <Play className="w-4 h-4 text-white mr-2" />
                                <span className="hidden sm:inline">Ver en YouTube</span>
                              </Button>
                              <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )} */}
            </Breadcrumb>
          </header>
        </div>
        : <></>
      }
    </>
  );
};