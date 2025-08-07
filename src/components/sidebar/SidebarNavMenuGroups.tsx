'use client';

import { ReactNode } from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';

type Items = {
  href: string;
  icon: ReactNode;
  label: string;
  authStatus?: 'signedOut' | 'signedIn';
  children?: Items[];
};

export function SidebarNavMenuGroup({
  items,
  className,
}: {
  items: Items[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className={className}>
      <SidebarMenu>
        {items.map((item) =>
          item.children ? (
            <Collapsible
              key={item.href}
              defaultOpen={
                pathname.startsWith(item.href) ||
                item.children?.some((child) => pathname.startsWith(child.href))
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 cursor-pointer">
                    {item.icon}
                    <span>{item.label}</span>
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <CollapsibleContent>
                {item.children.map((child) => (
                  <SidebarMenuItem key={child.href} className="pl-8">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === child.href}
                    >
                      <Link href={child.href}>
                        {child.icon}
                        <span>{child.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
