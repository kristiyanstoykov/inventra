import { Suspense } from 'react';
import { SidebarUserButtonClient } from './SidebarUserButtonClient';
// import { getCurrentUser } from '@/services/clerk/lib/getCurrentAuth';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOutIcon } from 'lucide-react';
import { getCurrentUser } from '@/auth/nextjs/currentUser';

export function SidebarUserButton() {
  return (
    <Suspense>
      <SidebarUserSuspense />
    </Suspense>
  );
}

async function SidebarUserSuspense() {
  const user = await getCurrentUser({ withFullUser: true });

  if (user instanceof Error) {
    return (
      <SidebarMenuButton>
        <LogOutIcon />
        <span>Log Out</span>
      </SidebarMenuButton>
    );
  }

  if (user == null) {
    return (
      <SidebarMenuButton>
        <LogOutIcon />
        <span>Log Out</span>
      </SidebarMenuButton>
    );
  }

  return <SidebarUserButtonClient user={user} />;
}
