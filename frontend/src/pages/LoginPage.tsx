import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import balancaImage from '@/assets/balanca.jpg';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            await login(data);
        } catch (err) {
            setError('Email ou senha inválidos');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Lado esquerdo - Imagem */}
            <div className="hidden bg-muted lg:block">
                <img
                    src={balancaImage}
                    alt="Balança da Justiça"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>

            {/* Lado direito - Formulário */}
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
                                <button
                                    type="button"
                                    className="ml-auto inline-block text-sm underline"
                                    onClick={() => {/* TODO: Implementar recuperação de senha */ }}
                                >
                                    Esqueceu sua senha?
                                </button>
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
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
