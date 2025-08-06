'use client';

import { SidebarTrigger } from '../ui/sidebar';

interface BreadcrumbsInterface {
  position: 'top' | 'bottom'
}

export const Breadcrumbs = ({ position }: BreadcrumbsInterface) => {

  return (
    <div className="relative z-50 text-gray-800 bg-gray-100 dark:bg-transparent dark:text-white">
      <SidebarTrigger className={`absolute -left-3 ${position === 'top' ? 'top-2' : 'bottom-4'}`} />
    </div>
  );
};