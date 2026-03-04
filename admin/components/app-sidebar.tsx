'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconBox,
  IconBuildingStore,
  IconCategory,
  IconChartBar,
  IconDiscount,
  IconFileText,
  IconLayoutDashboard,
  IconMail,
  IconPackage,
  IconPhoto,
  IconSettings,
  IconShoppingCart,
  IconSpeakerphone,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navigation = {
  main: [
    { title: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  ],
  operations: [
    { title: 'Orders', href: '/orders', icon: IconShoppingCart },
    { title: 'Products', href: '/products', icon: IconPackage },
    { title: 'Active Carts', href: '/carts', icon: IconChartBar },
    { title: 'Categories', href: '/categories', icon: IconCategory },
    { title: 'Customers', href: '/customers', icon: IconUsers },
    { title: 'Coupons', href: '/coupons', icon: IconDiscount },
  ],
  content: [
    { title: 'Hero Slides', href: '/content/hero', icon: IconPhoto },
    { title: 'Blog Posts', href: '/content/blog', icon: IconFileText },
    // { title: 'Promotions', href: '/content/promotions', icon: IconSpeakerphone }, // Removed - unused
    { title: 'Newsletter', href: '/newsletter', icon: IconMail },
  ],
  analytics: [
    { title: 'Sales Reports', href: '/analytics/sales', icon: IconChartBar },
    // { title: 'Customer Insights', href: '/analytics/customers', icon: IconUsersGroup }, // Removed
  ],
  settings: [],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    role: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <Link href="/dashboard">
                <IconBuildingStore className="!size-5" />
                <span className="text-base font-semibold font-serif">ALAIRE</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.main.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.operations.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.content.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.analytics.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ ...user, avatar: '' }} />
      </SidebarFooter>
    </Sidebar>
  )
}
