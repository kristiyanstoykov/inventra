import React, { ReactNode } from 'react';
import {
  ClipboardListIcon,
  Package,
  Home,
  User,
  Plus,
  Folder,
  ListCheck,
  Tag,
  Settings,
  ReceiptEuro,
} from 'lucide-react';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarNavMenuGroup } from '@/components/sidebar/SidebarNavMenuGroups';
import { SidebarUserButton } from '@/components/sidebar/SidebarUserButton';
import Header from '@/components/Header';

export default function AdminLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <AppSidebar
      content={
        <>
          {sidebar}
          <SidebarNavMenuGroup
            className=""
            items={[
              { href: '/admin', icon: <Home />, label: 'Dashboard' },
              {
                href: '/admin/products',
                icon: <Package />,
                label: 'Products',
                children: [
                  {
                    href: '/admin/products',
                    icon: <Package />,
                    label: 'All Products',
                  },
                  {
                    href: '/admin/products/new',
                    icon: <Plus />,
                    label: 'New Product',
                  },
                  {
                    href: '/admin/products/categories',
                    icon: <Folder />,
                    label: 'Categories',
                  },
                  {
                    href: '/admin/products/attributes',
                    icon: <ListCheck />,
                    label: 'Attributes',
                  },
                  {
                    href: '/admin/products/brands',
                    icon: <Tag />,
                    label: 'Brands',
                  },
                ],
              },
              {
                href: '/admin/orders',
                icon: <ClipboardListIcon />,
                label: 'Orders',
              },
              {
                href: '/admin/users',
                icon: <User />,
                label: 'Users',
              },
              {
                href: '/admin/settings',
                icon: <Settings />,
                label: 'Settings',
              },
            ]}
          />
        </>
      }
      footerButton={<SidebarUserButton />}
    >
      <Header />
      {children}
    </AppSidebar>
  );
}
