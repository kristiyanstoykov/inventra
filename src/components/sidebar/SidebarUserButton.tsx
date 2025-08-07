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
  let user = await getCurrentUser({ withFullUser: true });

  if (!user) {
    user = {
      id: 1,
      email: 'bob@abv.bg',
      firstName: 'Bob',
      lastName: 'Bobov',
      role: 'admin',
    };
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
