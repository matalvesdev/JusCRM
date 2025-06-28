import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setError('Token de verificação não encontrado na URL');
                setIsLoading(false);
                return;
            }

            try {
                await apiService.verifyEmail(token);
                setIsSuccess(true);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { error?: { message?: string } } } };
                setError(error.response?.data?.error?.message || 'Erro ao verificar email');
            } finally {
                setIsLoading(false);
            }
        };

        verifyEmail();
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Scale className="h-10 w-10 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Verificando Email</CardTitle>
                        <CardDescription>
                            Aguarde enquanto verificamos seu email...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        <CardTitle className="text-2xl">Email Verificado!</CardTitle>
                        <CardDescription>
                            Seu email foi verificado com sucesso
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800 text-center">
                                Sua conta está agora totalmente ativada.
                                Você pode fazer login e usar todos os recursos do JusCRM.
                            </p>
                        </div>

                        <Link to="/login">
                            <Button className="w-full">
                                Fazer Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Erro na Verificação</CardTitle>
                        <CardDescription>
                            Não foi possível verificar seu email
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800 text-center">
                                {error}
                            </p>
                        </div>

                        <ResendVerificationSection />

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

    return null;
};

const ResendVerificationSection: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await apiService.resendVerification(email);
            setIsSubmitted(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: { message?: string } } } };
            setError(error.response?.data?.error?.message || 'Erro ao reenviar email de verificação');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Email reenviado!</p>
                        <p>Verifique sua caixa de entrada.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <form onSubmit={handleResend} className="space-y-3">
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Digite seu email para reenviar a verificação:
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="flex space-x-2">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !email}
                        className="flex-1"
                    >
                        {isLoading ? 'Enviando...' : 'Reenviar'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForm(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <div className="text-center">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
                className="w-full"
            >
                <Mail className="mr-2 h-4 w-4" />
                Reenviar Email de Verificação
            </Button>
        </div>
    );
};
