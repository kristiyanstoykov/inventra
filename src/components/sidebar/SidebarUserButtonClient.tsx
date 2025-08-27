'use client';

import { logOut } from '@/auth/nextjs/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import {
  ChevronsUpDown,
  LogOutIcon,
  //   LogOutIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../ui/button';
import { InferSelectModel } from 'drizzle-orm';
import { UserTable } from '@/db/drizzle/schema';

type User = InferSelectModel<typeof UserTable>;

export function SidebarUserButtonClient({ user }: { user: User }) {
  const [, setIsLoggingOut] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  async function handleLogOut() {
    setIsLoggingOut(true);
    try {
      await logOut();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <UserInfo {...user} />
          <ChevronsUpDown className="ml-auto group-data-[state=collapsed]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={4}
        align="end"
        side={isMobile ? 'bottom' : 'right'}
        className="min-w-64 max-w-80"
      >
        <DropdownMenuLabel className="font-normal p-1">
          <UserInfo {...user} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/edit/${user.id}`}>
            <UserIcon className="mr-1" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings">
            <SettingsIcon className="mr-1" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:bg-muted m-0 p-0">
          <Button variant={'ghost'} onClick={async () => handleLogOut()}>
            <LogOutIcon className="mr-1" /> Log Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserInfo({ email, firstName, lastName }: User) {
  const name = `${firstName} ${lastName}`;
  const nameInitials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`;

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <Avatar className="rounded-lg size-8">
        <AvatarImage alt={name} />
        <AvatarFallback className="uppercase bg-primary text-primary-foreground">
          {nameInitials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1 min-w-0 leading-tight group-data-[state=collapsed]:hidden">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="truncate text-xs">{email}</span>
      </div>
    </div>
  );
}
