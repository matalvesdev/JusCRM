import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import type { Notification, NotificationType, NotificationPriority } from '@/types';
import { Plus, Trash2, Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotificationType>('SYSTEM_ANNOUNCEMENT');
    const [priority, setPriority] = useState<NotificationPriority>('MEDIUM');
    const [actionUrl, setActionUrl] = useState('');

    const notificationTypes = [
        { value: 'CASE_DEADLINE', label: 'Prazo de Caso' },
        { value: 'APPOINTMENT_REMINDER', label: 'Lembrete de Compromisso' },
        { value: 'DOCUMENT_UPLOADED', label: 'Documento Carregado' },
        { value: 'CASE_UPDATE', label: 'Atualização de Caso' },
        { value: 'PAYMENT_DUE', label: 'Pagamento Pendente' },
        { value: 'SYSTEM_ANNOUNCEMENT', label: 'Anúncio do Sistema' },
        { value: 'NEW_MESSAGE', label: 'Nova Mensagem' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
        { value: 'MEDIUM', label: 'Média', color: 'bg-blue-100 text-blue-800' },
        { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
        { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800' },
    ];

    // Buscar notificações
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await apiService.getNotifications({
                page: 1,
                limit: 20
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    // Criar notificação
    const createNotification = async () => {
        if (!title.trim() || !message.trim()) return;

        setCreating(true);
        try {
            await apiService.createNotification({
                title: title.trim(),
                message: message.trim(),
                type,
                priority,
                actionUrl: actionUrl.trim() || undefined,
            });

            // Limpar formulário
            setTitle('');
            setMessage('');
            setType('SYSTEM_ANNOUNCEMENT');
            setPriority('MEDIUM');
            setActionUrl('');

            // Recarregar lista
            fetchNotifications();
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        } finally {
            setCreating(false);
        }
    };

    // Deletar notificação
    const deleteNotification = async (id: string) => {
        try {
            await apiService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Erro ao deletar notificação:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CASE_DEADLINE': return '⏰';
            case 'APPOINTMENT_REMINDER': return '📅';
            case 'DOCUMENT_UPLOADED': return '📄';
            case 'CASE_UPDATE': return '📋';
            case 'PAYMENT_DUE': return '💰';
            case 'SYSTEM_ANNOUNCEMENT': return '📢';
            case 'NEW_MESSAGE': return '💬';
            default: return '🔔';
        }
    };

    const getPriorityColor = (priority: string) => {
        const option = priorityOptions.find(p => p.value === priority);
        return option?.color || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Bell className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Gerenciar Notificações</h1>
            </div>

            {/* Formulário de criação */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Criar Nova Notificação
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                placeholder="Título da notificação"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">URL de Ação (opcional)</label>
                            <Input
                                placeholder="/cases/123"
                                value={actionUrl}
                                onChange={(e) => setActionUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mensagem</label>
                        <Textarea
                            placeholder="Conteúdo da notificação"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {notificationTypes.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {getTypeIcon(option.value)} {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prioridade</label>
                            <Select value={priority} onValueChange={(value) => setPriority(value as NotificationPriority)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <Badge className={option.color} variant="outline">
                                                {option.label}
                                            </Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={createNotification}
                        disabled={!title.trim() || !message.trim() || creating}
                        className="w-full"
                    >
                        {creating ? 'Criando...' : 'Criar Notificação'}
                    </Button>
                </CardContent>
            </Card>

            {/* Lista de notificações */}
            <Card>
                <CardHeader>
                    <CardTitle>Notificações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            Nenhuma notificação encontrada
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">
                                                {getTypeIcon(notification.type)}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={getPriorityColor(notification.priority)}
                                            >
                                                {notification.priority}
                                            </Badge>
                                            {notification.isRead ? (
                                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                                    Lida
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                                    Não lida
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>
                                                Criada: {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                            {notification.readAt && (
                                                <span>
                                                    Lida: {new Date(notification.readAt).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                            {notification.actionUrl && (
                                                <span>
                                                    Ação: {notification.actionUrl}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
