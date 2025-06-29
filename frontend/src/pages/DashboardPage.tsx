import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, FileText, Calendar, TrendingUp, Clock, Activity, BarChart3, UserCheck, Shield } from 'lucide-react';
import { apiService } from '@/services/api';
import type {
    DashboardStats,
    CasesByStatusChart,
    UpcomingDeadlineData,
    CasesTimelineData,
    TopClient,
    RecentActivity,
    AuditStats
} from '@/types';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<CasesByStatusChart[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadlineData[]>([]);
    const [casesTimeline, setCasesTimeline] = useState<CasesTimelineData[]>([]);
    const [topClients, setTopClients] = useState<TopClient[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('[DashboardPage] Carregando dados do dashboard...');

                const [
                    statsData,
                    chartDataResponse,
                    deadlinesData,
                    timelineData,
                    clientsData,
                    activitiesData,
                    auditData
                ] = await Promise.all([
                    apiService.getDashboardStats(),
                    apiService.getCasesByStatusChart(),
                    apiService.getUpcomingDeadlinesDetailed(7),
                    apiService.getCasesTimeline('month'),
                    apiService.getTopClients(5),
                    apiService.getRecentActivities(10),
                    apiService.getAuditStats('week')
                ]);

                console.log('[DashboardPage] Dados carregados:', {
                    statsData,
                    chartDataResponse,
                    deadlinesData,
                    timelineData,
                    clientsData,
                    activitiesData,
                    auditData
                });

                setStats(statsData);
                setChartData(chartDataResponse);
                setUpcomingDeadlines(deadlinesData);
                setCasesTimeline(timelineData);
                setTopClients(clientsData);
                setRecentActivities(activitiesData);
                setAuditStats(auditData);
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
                                                {new Date(deadline.dueDate).toLocaleDateString('pt-BR')}
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

            {/* Novos Widgets - Segunda Linha */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Timeline de Casos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            Timeline de Casos
                        </CardTitle>
                        <CardDescription>
                            Casos criados nos últimos meses
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {casesTimeline.length > 0 ? (
                                casesTimeline.slice(0, 6).map((item) => (
                                    <div key={item.period} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <TrendingUp className="h-3 w-3 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{item.period}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.total} casos totais
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-600">
                                                {item.active} ativos
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.closed} fechados
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-6 text-muted-foreground">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Nenhum dado disponível
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Clientes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            Top Clientes
                        </CardTitle>
                        <CardDescription>
                            Clientes com mais casos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topClients.length > 0 ? (
                                topClients.map((client, index) => (
                                    <div key={client.clientId} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {client.clientName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {client.totalCases} casos ({client.activeCases} ativos)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                Último: {new Date(client.lastCaseDate).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-6 text-muted-foreground">
                                    <Users className="h-4 w-4 mr-2" />
                                    Nenhum cliente encontrado
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Terceira Linha - Atividades e Auditoria */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Atividades Recentes Melhoradas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            Atividades Recentes
                        </CardTitle>
                        <CardDescription>
                            Últimas ações no sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActivities.length > 0 ? (
                                recentActivities.slice(0, 8).map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            {activity.type === 'AUDIT' ? (
                                                <Shield className="h-3 w-3 text-blue-600" />
                                            ) : (
                                                <Briefcase className="h-3 w-3 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.action} • {activity.entityType}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(activity.createdAt).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-6 text-muted-foreground">
                                    <Activity className="h-4 w-4 mr-2" />
                                    Nenhuma atividade recente
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Estatísticas de Auditoria */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            Auditoria (7 dias)
                        </CardTitle>
                        <CardDescription>
                            Atividades de segurança e logs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {auditStats ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {auditStats.totalActions}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Total de ações
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {auditStats.loginCount}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Logins
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {auditStats.topActions.slice(0, 3).map((action) => (
                                            <div key={action.action} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <span className="text-sm font-medium">{action.action}</span>
                                                <span className="text-sm text-muted-foreground">{action.count}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center p-6 text-muted-foreground">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Carregando estatísticas...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
