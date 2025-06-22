import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import justicaImage from '@/assets/justica.jpg';

const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação de senha obrigatória'),
    role: z.enum(['ADMIN', 'LAWYER', 'ASSISTANT'], {
        errorMap: () => ({ message: 'Selecione um papel válido' }),
    }),
    phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(null);

            // TODO: Implementar chamada para API de registro
            console.log('Register data:', data);

            // Simulação de sucesso por enquanto
            setSuccess('Conta criada com sucesso! Redirecionando para login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError('Erro ao criar conta. Tente novamente.');
            console.error('Register error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Lado esquerdo - Formulário */}
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[400px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Criar Conta</h1>
                        <p className="text-balance text-muted-foreground">
                            Preencha os dados abaixo para criar sua conta no JusCRM
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome completo"
                                {...register('name')}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

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
                            <Label htmlFor="phone">Telefone (Opcional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(11) 99999-9999"
                                {...register('phone')}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Função</Label>
                            <Select onValueChange={(value: string) => setValue('role', value as 'ADMIN' | 'LAWYER' | 'ASSISTANT')}>
                                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Selecione sua função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="LAWYER">Advogado</SelectItem>
                                    <SelectItem value="ASSISTANT">Assistente</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-red-500">{errors.role.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Sua senha"
                                {...register('password')}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirme sua senha"
                                {...register('confirmPassword')}
                                className={errors.confirmPassword ? 'border-red-500' : ''}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-sm text-green-500 text-center bg-green-50 p-2 rounded">
                                {success}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Criando conta...' : 'Criar Conta'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Já tem uma conta?{' '}
                        <button
                            type="button"
                            className="underline"
                            onClick={() => navigate('/login')}
                        >
                            Fazer login
                        </button>
                    </div>
                </div>
            </div>

            {/* Lado direito - Imagem */}
            <div className="hidden bg-muted lg:block">
                <img
                    src={justicaImage}
                    alt="Estátua da Justiça"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    );
};
