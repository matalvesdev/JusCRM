import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TopBar } from '@/components/TopBar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <TopBar />
                    <main className="flex-1 overflow-auto p-6 bg-slate-50">
                        {children} {/* Renderiza o conteúdo da rota filha */}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};
