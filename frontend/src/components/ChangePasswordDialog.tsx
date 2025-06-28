import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { apiService } from '@/services/api';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordDialogProps {
    children: React.ReactNode;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [errors, setErrors] = useState<string[]>([]);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('A senha deve ter pelo menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('A senha deve conter pelo menos uma letra maiúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('A senha deve conter pelo menos uma letra minúscula');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('A senha deve conter pelo menos um número');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('A senha deve conter pelo menos um caractere especial');
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors: string[] = [];

        // Validar senha atual
        if (!passwords.current) {
            validationErrors.push('Senha atual é obrigatória');
        }

        // Validar nova senha
        const passwordErrors = validatePassword(passwords.new);
        validationErrors.push(...passwordErrors);

        // Validar confirmação
        if (passwords.new !== passwords.confirm) {
            validationErrors.push('As senhas não coincidem');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors([]);

        try {
            await apiService.changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.new
            });

            // Sucesso - limpar formulário e fechar modal
            setPasswords({ current: '', new: '', confirm: '' });
            setOpen(false);

            // TODO: Mostrar toast de sucesso
            alert('Senha alterada com sucesso!');

        } catch (error: unknown) {
            console.error('Erro ao alterar senha:', error);
            let errorMessage = 'Erro ao alterar senha';
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                errorMessage = axiosError.response?.data?.error || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setErrors([errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleClose = () => {
        if (!loading) {
            setOpen(false);
            setPasswords({ current: '', new: '', confirm: '' });
            setErrors([]);
            setShowPasswords({ current: false, new: false, confirm: false });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Key className="h-5 w-5 mr-2" />
                        Alterar Senha
                    </DialogTitle>
                    <DialogDescription>
                        Digite sua senha atual e escolha uma nova senha segura.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwords.current}
                                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                                className="pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('current')}
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwords.new}
                                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                className="pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('new')}
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwords.confirm}
                                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                className="pr-10"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('confirm')}
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {errors.length > 0 && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-800">
                                <ul className="space-y-1">
                                    {errors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                        <strong>Requisitos da senha:</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• Pelo menos 8 caracteres</li>
                            <li>• Uma letra maiúscula</li>
                            <li>• Uma letra minúscula</li>
                            <li>• Um número</li>
                            <li>• Um caractere especial</li>
                        </ul>
                    </div>
                </form>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
