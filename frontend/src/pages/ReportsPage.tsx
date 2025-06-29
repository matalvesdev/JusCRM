import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Button
} from '@/components/ui/button';
import {
    Badge
} from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Input
} from '@/components/ui/input';
import {
    Label
} from '@/components/ui/label';
import {
    BarChart3,
    Download,
    FileText,
    Filter,
    Plus,
    RefreshCw,
    Trash2,
    Calendar,
    Users,
    Briefcase,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '@/services/api';
import type {
    Report,
    ReportType,
    ReportFormat,
    ReportStatus,
    CreateReportRequest,
    ReportStats
} from '@/types';

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    CASES_BY_PERIOD: 'Casos por Período',
    CASES_BY_STATUS: 'Casos por Status',
    CASES_BY_CLIENT: 'Casos por Cliente',
    CLIENT_ACTIVITY: 'Atividade de Clientes',
    PRODUCTIVITY: 'Produtividade',
    FINANCIAL: 'Financeiro',
    CUSTOM: 'Personalizado'
};

const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
    PDF: 'PDF',
    EXCEL: 'Excel',
    CSV: 'CSV',
    JSON: 'JSON'
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    PENDING: 'Pendente',
    GENERATING: 'Gerando',
    COMPLETED: 'Concluído',
    FAILED: 'Falhou'
};

const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    GENERATING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800'
};

const REPORT_TYPE_ICONS: Record<ReportType, React.ReactNode> = {
    CASES_BY_PERIOD: <Calendar className="h-4 w-4" />,
    CASES_BY_STATUS: <Briefcase className="h-4 w-4" />,
    CASES_BY_CLIENT: <Users className="h-4 w-4" />,
    CLIENT_ACTIVITY: <BarChart3 className="h-4 w-4" />,
    PRODUCTIVITY: <Clock className="h-4 w-4" />,
    FINANCIAL: <DollarSign className="h-4 w-4" />,
    CUSTOM: <FileText className="h-4 w-4" />
};

export const ReportsPage: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [filters, setFilters] = useState({
        type: 'ALL' as 'ALL' | ReportType,
        status: 'ALL' as 'ALL' | ReportStatus,
        page: 1,
        limit: 10
    });

    // Estado para o diálogo de criação
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newReport, setNewReport] = useState<CreateReportRequest>({
        type: 'CASES_BY_PERIOD',
        title: '',
        description: '',
        format: 'PDF',
        parameters: {},
        startDate: '',
        endDate: ''
    });

    const loadReports = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.getReports(filters);
            setReports(response.data);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadStats = useCallback(async () => {
        try {
            const statsData = await apiService.getReportStats();
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const handleCreateReport = async () => {
        if (!newReport.title.trim()) {
            alert('Por favor, preencha o título do relatório');
            return;
        }

        try {
            setCreating(true);
            await apiService.createReport(newReport);
            setCreateDialogOpen(false);
            setNewReport({
                type: 'CASES_BY_PERIOD',
                title: '',
                description: '',
                format: 'PDF',
                parameters: {},
                startDate: '',
                endDate: ''
            });
            loadReports();
            loadStats();
        } catch (error) {
            console.error('Erro ao criar relatório:', error);
            alert('Erro ao criar relatório. Tente novamente.');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (report: Report) => {
        if (report.status !== 'COMPLETED') {
            alert('Relatório ainda não está pronto para download');
            return;
        }

        try {
            const blob = await apiService.downloadReport(report.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = report.fileName || `relatorio-${report.id}.${report.format.toLowerCase()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            alert('Erro ao fazer download do relatório');
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!confirm('Tem certeza que deseja deletar este relatório?')) {
            return;
        }

        try {
            await apiService.deleteReport(reportId);
            loadReports();
            loadStats();
        } catch (error) {
            console.error('Erro ao deletar relatório:', error);
            alert('Erro ao deletar relatório');
        }
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Relatórios</h1>
                    <p className="text-muted-foreground mt-2">
                        Gere e gerencie relatórios do sistema
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Relatório
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Relatório</DialogTitle>
                            <DialogDescription>
                                Configure os parâmetros do relatório que deseja gerar
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={newReport.title}
                                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                                    placeholder="Ex: Relatório Mensal de Casos"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Descrição (opcional)</Label>
                                <Input
                                    id="description"
                                    value={newReport.description}
                                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                                    placeholder="Breve descrição do relatório"
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Tipo</Label>
                                <Select
                                    value={newReport.type}
                                    onValueChange={(value: ReportType) => setNewReport({ ...newReport, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="format">Formato</Label>
                                <Select
                                    value={newReport.format}
                                    onValueChange={(value: ReportFormat) => setNewReport({ ...newReport, format: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(REPORT_FORMAT_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate">Data Inicial</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={newReport.startDate}
                                        onChange={(e) => setNewReport({ ...newReport, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate">Data Final</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={newReport.endDate}
                                        onChange={(e) => setNewReport({ ...newReport, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateReport}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        'Criar Relatório'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Estatísticas */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalReports}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.completedReports}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.failedReports}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Label>Tipo</Label>
                            <Select
                                value={filters.type}
                                onValueChange={(value: 'ALL' | ReportType) =>
                                    setFilters({ ...filters, type: value, page: 1 })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos os tipos</SelectItem>
                                    {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Label>Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value: 'ALL' | ReportStatus) =>
                                    setFilters({ ...filters, status: value, page: 1 })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos os status</SelectItem>
                                    {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={loadReports} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Relatórios */}
            <Card>
                <CardHeader>
                    <CardTitle>Relatórios Gerados</CardTitle>
                    <CardDescription>
                        {reports.length} relatório(s) encontrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum relatório encontrado</p>
                            <p className="text-sm">Crie seu primeiro relatório clicando no botão acima</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {REPORT_TYPE_ICONS[report.type]}
                                                <h3 className="font-semibold">{report.title}</h3>
                                                <Badge className={REPORT_STATUS_COLORS[report.status]}>
                                                    {REPORT_STATUS_LABELS[report.status]}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {REPORT_FORMAT_LABELS[report.format]}
                                                </Badge>
                                            </div>

                                            {report.description && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {report.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Tipo: {REPORT_TYPE_LABELS[report.type]}</span>
                                                <span>Criado em: {formatDate(report.createdAt)}</span>
                                                {report.completedAt && (
                                                    <span>Concluído em: {formatDate(report.completedAt)}</span>
                                                )}
                                                {report.fileSize && (
                                                    <span>Tamanho: {formatFileSize(report.fileSize)}</span>
                                                )}
                                                <span>Downloads: {report.downloadCount}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {report.status === 'COMPLETED' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(report)}
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(report.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
