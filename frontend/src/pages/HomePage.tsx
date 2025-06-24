import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
    console.log('[HomePage] Renderizando HomePage...');
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate(); useEffect(() => {
        if (!isLoading && isAuthenticated) {
            console.log('[HomePage] Usuário autenticado, redirecionando para app...');
            navigate('/app', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto p-8">
                <div className="mb-8">
                    <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">JusCRM</h1>
                    <p className="text-gray-600 mb-8">Sistema de Gestão para Escritórios de Advocacia Trabalhista</p>
                </div>

                <div className="space-y-4 mb-8">
                    <Link
                        to="/login"
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block w-full sm:w-auto"
                    >
                        Fazer Login
                    </Link>
                    <br className="sm:hidden" />
                    <Link
                        to="/register"
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block w-full sm:w-auto ml-0 sm:ml-4 mt-4 sm:mt-0"
                    >
                        Registrar-se
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Credenciais de Teste:</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Administrador:</strong> admin@juscrm.com / admin123</p>
                        <p><strong>Advogado:</strong> joao@juscrm.com / lawyer123</p>
                        <p><strong>Assistente:</strong> maria@juscrm.com / assistant123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
