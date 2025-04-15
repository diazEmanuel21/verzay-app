'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/solid';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '../ui/sidebar';

const breadcrumbLabels: Record<string, string> = {
  flow: 'flujos',
  profile: 'perfil',
  sessions: 'Leads',
  credits: 'planes',
  tools: 'herramientas',
  dashboard: 'conexiones',
  workflow: 'workflow',
  'auto-replies': 'Respuestas rápidas',
  reseller: 'afiliados'
};

export const Breadcrumbs = () => {
  const pathname = usePathname();

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
    <Breadcrumb>
      <BreadcrumbList>
        <SidebarTrigger /> |

        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
              <HomeIcon className="h-5" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Separador inicial */}
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}

        {/* Si hay muchos segmentos, mostramos un BreadcrumbEllipsis */}
        {breadcrumbs.length > 3 && (
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
        )}

        {/* Si no hay muchos segmentos, mostramos todos */}
        {breadcrumbs.length <= 3 &&
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
          ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};