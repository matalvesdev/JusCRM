import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, LoginRequest, RegisterRequest } from '@/types';
import { apiService } from '@/services/api';

console.log('[AuthContext] Módulo AuthContext carregado!');

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest & { rememberMe?: boolean }) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Volta para true para verificação inicial

    const isAuthenticated = !!user;

    // Verifica token salvo ao carregar a aplicação
    useEffect(() => {
        const checkAuth = async () => {
            console.log('[AuthContext] Iniciando verificação de autenticação...');
            try {
                const token = localStorage.getItem('auth_token');
                const tokenDataStr = localStorage.getItem('auth_token_data');
                console.log(`[AuthContext] Token encontrado: ${token ? 'Sim' : 'Não'}`);

                if (token && tokenDataStr) {
                    const tokenData = JSON.parse(tokenDataStr);
                    const now = Date.now();

                    // Verifica se o token expirou
                    if (now > tokenData.expiresAt) {
                        console.log('[AuthContext] Token expirado, removendo...');
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_token_data');
                        setUser(null);
                        return;
                    }

                    console.log('[AuthContext] Verificando token com a API...');
                    const userData = await apiService.me();
                    console.log('[AuthContext] Token válido. Usuário recebido:', userData);
                    setUser(userData);
                } else if (token) {
                    // Token sem dados de expiração (compatibilidade)
                    console.log('[AuthContext] Verificando token legado com a API...');
                    const userData = await apiService.me();
                    console.log('[AuthContext] Token válido. Usuário recebido:', userData);
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('[AuthContext] Erro ao verificar token (provavelmente inválido ou expirado):', error);
                localStorage.removeItem('auth_token');
                setUser(null);
            } finally {
                console.log('[AuthContext] Verificação de autenticação finalizada.');
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginRequest & { rememberMe?: boolean }): Promise<void> => {
        console.log('[AuthContext] Tentando fazer login...', credentials);
        try {
            setIsLoading(true);
            const { rememberMe, ...loginData } = credentials;
            const response = await apiService.login(loginData);
            console.log('[AuthContext] Login bem-sucedido. Resposta:', response);

            // Define tempo de expiração baseado no remember me
            const expirationTime = rememberMe
                ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 dias em ms
                : Date.now() + (24 * 60 * 60 * 1000); // 24 horas em ms

            const tokenData = {
                token: response.accessToken,
                expiresAt: expirationTime,
                rememberMe: !!rememberMe
            };

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('auth_token_data', JSON.stringify(tokenData));
            setUser(response.user);
        } catch (error) {
            console.error('[AuthContext] Falha no login:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: RegisterRequest): Promise<void> => {
        console.log('[AuthContext] Tentando fazer registro...', userData);
        try {
            setIsLoading(true);
            const response = await apiService.register(userData);
            console.log('[AuthContext] Registro bem-sucedido. Resposta:', response);
            localStorage.setItem('auth_token', response.accessToken);
            setUser(response.user);
        } catch (error) {
            console.error('[AuthContext] Falha no registro:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        console.log('[AuthContext] Fazendo logout...');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_data');
        setUser(null);
        apiService.logout().catch(console.error);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
    }; return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
