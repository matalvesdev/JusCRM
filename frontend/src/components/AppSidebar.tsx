import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Scale,
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    Calendar,
    CreditCard,
    Activity,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Clientes',
        url: '/clients',
        icon: Users,
    },
    {
        title: 'Casos',
        url: '/cases',
        icon: Briefcase,
    },
    {
        title: 'Documentos',
        url: '/documents',
        icon: FileText,
    },
    {
        title: 'Agenda',
        url: '/appointments',
        icon: Calendar,
    },
    {
        title: 'Pagamentos',
        url: '/payments',
        icon: CreditCard,
    },
    {
        title: 'Atividades',
        url: '/activities',
        icon: Activity,
    },
    {
        title: 'Configurações',
        url: '/settings',
        icon: Settings,
    },
];

export const AppSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-6 py-4">
                    <Scale className="h-6 w-6" />
                    <span className="font-bold text-lg">JusCRM</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                                <Link
                                    to={item.url}
                                    className={cn(
                                        'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                                        location.pathname === item.url
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
};
