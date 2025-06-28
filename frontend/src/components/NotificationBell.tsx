import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { apiService } from '@/services/api';
import type { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Buscar notificações não lidas
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await apiService.getNotifications({
                isRead: false,
                limit: 10,
                page: 1
            });
            setNotifications(response.data);
            setUnreadCount(response.data.length);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        } finally {
            setLoading(false);
        }
    };

    // Buscar contagem de não lidas
    const fetchUnreadCount = async () => {
        try {
            const response = await apiService.getUnreadNotificationsCount();
            setUnreadCount(response.count);
        } catch (error) {
            console.error('Erro ao buscar contagem de notificações:', error);
        }
    };

    // Marcar como lida
    const markAsRead = async (id: string) => {
        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    // Marcar todas como lidas
    const markAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error);
        }
    };

    // Carregar dados iniciais
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    // Carregar notificações quando abrir o dropdown
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Função para obter cor da prioridade
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Função para obter ícone do tipo
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

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Notificações</CardTitle>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-7 text-xs"
                                >
                                    <CheckCheck className="mr-1 h-3 w-3" />
                                    Marcar todas como lidas
                                </Button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Você tem {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0 max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Carregando notificações...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Nenhuma notificação não lida
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div key={notification.id} className="p-3 hover:bg-gray-50 group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm">
                                                        {getTypeIcon(notification.type)}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                                                    >
                                                        {notification.priority}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(notification.createdAt).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {notification.actionUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 p-0 text-xs text-blue-600 hover:text-blue-800"
                                                            onClick={() => {
                                                                window.open(notification.actionUrl, '_blank');
                                                                markAsRead(notification.id);
                                                            }}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
