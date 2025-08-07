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
} from 'lucide-react';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarNavMenuGroup } from '@/components/sidebar/SidebarNavMenuGroups';
import { SidebarUserButton } from '@/components/sidebar/SidebarUserButton';
import Header from '@/components/Header';

// const menuItems = [
//   { label: 'Dashboard', href: '/admin' },
//   { label: 'Warehouses', href: '/admin/warehouses' },
//   {
//     label: 'Products',
//     href: '#',
//     subItems: [
//       { label: 'All Products', href: '/admin/products' },
//       { label: 'New Product', href: '/admin/products/new' },
//       { label: 'Categories', href: '/admin/products/categories' },
//       { label: 'Attributes', href: '/admin/products/attributes' },
//     ],
//   },
//   { label: 'Stock', href: '/admin/stock' },
//   { label: 'Orders', href: '/admin/orders' },
//   { label: 'Invites', href: '/admin/invites' },
//   { label: 'Users', href: '/admin/users' },
//   // { label: 'Settings', href: '/admin/settings' }, // maybe later
// ];

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
                label: 'Clients',
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
