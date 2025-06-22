import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TopBar } from '@/components/TopBar';

export const MainLayout: React.FC = () => {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <TopBar />
                    <main className="flex-1 overflow-auto p-6 bg-slate-50">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};
