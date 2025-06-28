import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        if (!token) {
            setError('Token de recuperação não encontrado na URL');
        }
    }, [token]);

    const validatePassword = (pwd: string): string[] => {
        const errors: string[] = [];
        if (pwd.length < 6) {
            errors.push('A senha deve ter pelo menos 6 caracteres');
        }
        if (!/(?=.*[a-z])/.test(pwd)) {
            errors.push('A senha deve conter pelo menos uma letra minúscula');
        }
        if (!/(?=.*[A-Z])/.test(pwd)) {
            errors.push('A senha deve conter pelo menos uma letra maiúscula');
        }
        if (!/(?=.*\d)/.test(pwd)) {
            errors.push('A senha deve conter pelo menos um número');
        }
        return errors;
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setValidationErrors(validatePassword(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('Token de recuperação não encontrado');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        const errors = validatePassword(password);
        if (errors.length > 0) {
            setError('Por favor, corrija os problemas na senha antes de continuar');
            return;
        }

        setIsLoading(true);

        try {
            await apiService.resetPassword(token, password);
            setIsSuccess(true);

            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Erro ao redefinir senha');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Senha Redefinida!</CardTitle>
                        <CardDescription>
                            Sua senha foi alterada com sucesso
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800 text-center">
                                Você será redirecionado para o login em alguns segundos...
                            </p>
                        </div>

                        <Link to="/login">
                            <Button className="w-full">
                                Fazer Login Agora
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Link Inválido</CardTitle>
                        <CardDescription>
                            O link de recuperação de senha não é válido ou expirou
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <Link to="/forgot-password">
                                <Button variant="outline" className="w-full">
                                    Solicitar Novo Link
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center">
                            <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Voltar ao Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Scale className="h-10 w-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha abaixo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Digite sua nova senha"
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            {validationErrors.length > 0 && (
                                <div className="text-xs text-red-600 space-y-1">
                                    {validationErrors.map((error, index) => (
                                        <p key={index}>• {error}</p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirme sua nova senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-600">As senhas não coincidem</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !password || !confirmPassword || validationErrors.length > 0 || password !== confirmPassword}
                        >
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Redefinindo...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Redefinir Senha
                                </>
                            )}
                        </Button>

                        <div className="pt-4 text-center">
                            <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Voltar ao Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
