import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redireciona usuários já autenticados
    useEffect(() => {
        if (isAuthenticated) {
            console.log('[LoginPage] Usuário já autenticado, redirecionando para /app');
            navigate('/app', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    }); const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('[LoginPage] Tentando fazer login:', data);

            await login(data);
            console.log('[LoginPage] Login bem-sucedido, redirecionando...');
            navigate('/app');

        } catch (err) {
            console.error('[LoginPage] Erro no login:', err);
            // Mensagens de erro melhoradas
            if (err instanceof Error) {
                if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                    setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
                } else if (err.message.includes('network') || err.message.includes('fetch')) {
                    setError('Erro de conexão. Verifique sua internet e tente novamente.');
                } else if (err.message.includes('timeout')) {
                    setError('Tempo limite excedido. Tente novamente em alguns instantes.');
                } else {
                    setError('Erro inesperado. Tente novamente ou contate o suporte.');
                }
            } else {
                setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    }; return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Lado esquerdo - Formulário */}
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">JusCRM</h1>
                        <p className="text-balance text-muted-foreground">
                            Entre com suas credenciais para acessar o sistema
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                {...register('email')}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Senha</Label>
                                <Link
                                    to="/forgot-password"
                                    className="ml-auto inline-block text-sm underline text-blue-600 hover:text-blue-800"
                                >
                                    Esqueceu sua senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rememberMe"
                                {...register('rememberMe')}
                            />
                            <Label
                                htmlFor="rememberMe"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Manter-me conectado por 30 dias
                            </Label>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Não tem uma conta?{' '}
                        <button
                            type="button"
                            className="underline"
                            onClick={() => navigate('/register')}
                        >
                            Registre-se
                        </button>                    </div>
                </div>
            </div>

            {/* Lado direito - Imagem */}
            <div className="hidden bg-muted lg:block">
                <img
                    src="/src/assets/balanca.jpg"
                    alt="Balança da Justiça"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    );
};
