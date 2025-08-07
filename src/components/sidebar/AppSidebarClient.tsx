'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { ReactNode } from 'react';

export function AppSidebarClient({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        <div className="p-2 border-b flex items-center gap-1">
          <SidebarTrigger />
          <Image
            src="/inventra-logo.png"
            alt="Inventra Logo"
            width={20}
            height={20}
            priority
            style={{ height: '20px', width: '20px' }}
            className="align-middle"
          />
          <span className="text-xl">Inventra</span>
        </div>
        <div className="flex-1 flex">{children}</div>
      </div>
    );
  }

  return children;
}
