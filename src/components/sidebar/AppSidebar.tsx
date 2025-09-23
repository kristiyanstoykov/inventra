import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebarClient } from './AppSidebarClient';
import { ReactNode } from 'react';
import Image from 'next/image';

export function AppSidebar({
  children,
  content,
  footerButton,
}: {
  children: ReactNode;
  content: ReactNode;
  footerButton: ReactNode;
}) {
  return (
    <SidebarProvider className="overflow-y-hidden">
      <AppSidebarClient>
        <Sidebar collapsible="icon" className="overflow-hidden">
          <SidebarHeader className="flex-row items-center">
            <SidebarTrigger className="cursor-pointer" />
            <Image
              src="/inventra-logo.png"
              alt="Inventra Logo"
              width={20}
              height={20}
              priority
              style={{ height: '20px', width: '20px' }}
              className="align-middle"
            />
            <span className="text-xl text-nowrap">Inventra</span>
          </SidebarHeader>
          <SidebarContent>{content}</SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>{footerButton}</SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">{children}</main>
      </AppSidebarClient>
    </SidebarProvider>
  );
}
