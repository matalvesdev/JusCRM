import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, FileText, Calendar, TrendingUp, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import type { DashboardStats, CasesByStatusChart, UpcomingDeadline } from '@/types';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<CasesByStatusChart[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('[DashboardPage] Carregando dados do dashboard...');

                const [statsData, chartDataResponse, deadlinesData] = await Promise.all([
                    apiService.getDashboardStats(),
                    apiService.getCasesByStatusChart(),
                    apiService.getUpcomingDeadlines(7)
                ]);

                console.log('[DashboardPage] Dados carregados:', { statsData, chartDataResponse, deadlinesData });

                setStats(statsData);
                setChartData(chartDataResponse);
                setUpcomingDeadlines(deadlinesData);
            } catch (err) {
                console.error('[DashboardPage] Erro ao carregar dados:', err);
                setError('Erro ao carregar dados do dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    } return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral do seu escritório de advocacia
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Clientes
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Clientes cadastrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Casos Ativos
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeCases || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Casos em andamento
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Documentos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Arquivos no sistema
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Próximos Prazos
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Nos próximos 7 dias
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Casos por Status */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Casos por Status</CardTitle>
                        <CardDescription>
                            Distribuição dos casos por status atual
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {chartData.length > 0 ? (
                                chartData.map((item) => (
                                    <div key={item.status} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className="w-3 h-3 rounded-full bg-blue-500"
                                            ></div>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {item.count} casos
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Nenhum caso encontrado
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Próximos Compromissos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Próximos Prazos</CardTitle>
                        <CardDescription>
                            Prazos e compromissos importantes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingDeadlines.length > 0 ? (
                                upcomingDeadlines.map((deadline) => (
                                    <div key={deadline.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <div className="p-1 rounded-full bg-blue-100">
                                            <Clock className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {deadline.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {deadline.clientName} • {deadline.caseTitle}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(deadline.startDate).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-4 text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Nenhum prazo nos próximos dias
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Atividades Recentes */}
            <Card>
                <CardHeader>
                    <CardTitle>Atividades Recentes</CardTitle>
                    <CardDescription>
                        Últimas atualizações do sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Briefcase className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{activity.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(activity.createdAt).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center p-6 text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                Nenhuma atividade recente
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
