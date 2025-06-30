import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/MainLayout';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    console.log('[ProtectedRoute] Estado:', {
        isAuthenticated,
        isLoading,
        hasUser: !!user,
        pathname: location.pathname
    });

    if (isLoading) {
        console.log('[ProtectedRoute] Ainda carregando, mostrando spinner...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('[ProtectedRoute] Usuário autenticado, renderizando conteúdo protegido com MainLayout');
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
};
