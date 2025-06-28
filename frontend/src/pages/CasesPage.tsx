import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Eye, MoreHorizontal, Loader2, FileText, Clock, Gavel, Trash2, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import type { Case, ClientProfile } from '@/types';
import { format } from 'date-fns';

// Schema para validação do formulário
const caseFormSchema = z.object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
    description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
    type: z.enum(["CIVIL", "CRIMINAL", "LABOR", "FAMILY", "CORPORATE", "OTHER"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    clientId: z.string().min(1, "Cliente é obrigatório"),
    courtName: z.string().optional(),
    processNumber: z.string().optional(),
    judge: z.string().optional(),
    prosecutor: z.string().optional(),
    initialValue: z.number().optional(),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    SUSPENDED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-800",
};

const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
};

const typeLabels = {
    CIVIL: "Cível",
    CRIMINAL: "Criminal",
    LABOR: "Trabalhista",
    FAMILY: "Família",
    CORPORATE: "Empresarial",
    OTHER: "Outros",
};

export const CasesPage: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);

    const form = useForm<CaseFormData>({
        resolver: zodResolver(caseFormSchema),
        defaultValues: {
            type: "CIVIL",
            priority: "MEDIUM",
        },
    });

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && statusFilter !== 'all' && { status: statusFilter as "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED" }),
                ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
            };

            const response = await apiService.getCases(params);
            setCases(response.data || []);
            setTotalPages(response.pagination?.pages || 1);
        } catch (error) {
            toast.error('Erro ao carregar casos');
            console.error('Error loading cases:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, typeFilter]);

    const loadClients = useCallback(async () => {
        try {
            const response = await apiService.getClients({ limit: 1000 });
            setClients(response.data || []);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }, []);

    useEffect(() => {
        loadCases();
        loadClients();
    }, [loadCases, loadClients]);

    const handleCreateCase = async (data: CaseFormData) => {
        try {
            // Transform form data to API format
            const apiData = {
                title: data.title,
                description: data.description,
                type: data.type, // createCase accepts string type
                clientId: data.clientId,
                value: data.initialValue,
                number: data.processNumber,
            };
            await apiService.createCase(apiData);
            toast.success('Caso criado com sucesso!');
            setIsCreateDialogOpen(false);
            form.reset();
            loadCases();
        } catch (error) {
            toast.error('Erro ao criar caso');
            console.error('Error creating case:', error);
        }
    };

    const handleEditCase = async (data: CaseFormData) => {
        if (!selectedCase) return;

        try {
            // Transform form data to API format - only include fields that exist in Case interface
            const apiData: Partial<Case> = {
                title: data.title,
                description: data.description,
                type: data.type === "LABOR" ? "OTHER" : "OTHER", // Map to valid Case type
                value: data.initialValue,
                number: data.processNumber,
            };
            await apiService.updateCase(selectedCase.id, apiData);
            toast.success('Caso atualizado com sucesso!');
            setIsEditDialogOpen(false);
            setSelectedCase(null);
            form.reset();
            loadCases();
        } catch (error) {
            toast.error('Erro ao atualizar caso');
            console.error('Error updating case:', error);
        }
    };

    const handleDeleteCase = async (caseItem: Case) => {
        if (!confirm(`Tem certeza que deseja excluir o caso ${caseItem.title}?`)) return;

        try {
            await apiService.deleteCase(caseItem.id);
            toast.success('Caso excluído com sucesso!');
            loadCases();
        } catch (error) {
            toast.error('Erro ao excluir caso');
            console.error('Error deleting case:', error);
        }
    };

    const handleChangeStatus = async (caseItem: Case, newStatus: string) => {
        try {
            await apiService.updateCaseStatus(caseItem.id, newStatus);
            toast.success('Status atualizado com sucesso!');
            loadCases();
        } catch (error) {
            toast.error('Erro ao atualizar status');
            console.error('Error updating status:', error);
        }
    };

    const openEditDialog = (caseItem: Case) => {
        setSelectedCase(caseItem);

        // Map case type to form type, defaulting to "OTHER" if not found
        const mapCaseTypeToFormType = (caseType: string): "CIVIL" | "CRIMINAL" | "LABOR" | "FAMILY" | "CORPORATE" | "OTHER" => {
            const typeMapping: Record<string, "CIVIL" | "CRIMINAL" | "LABOR" | "FAMILY" | "CORPORATE" | "OTHER"> = {
                "CIVIL": "CIVIL",
                "CRIMINAL": "CRIMINAL",
                "LABOR": "LABOR",
                "FAMILY": "FAMILY",
                "CORPORATE": "CORPORATE",
                "RESCISAO_INDIRETA": "LABOR",
                "HORAS_EXTRAS": "LABOR",
                "ADICIONAL_INSALUBRIDADE": "LABOR",
                "ADICIONAL_PERICULOSIDADE": "LABOR",
                "ASSEDIO_MORAL": "LABOR",
                "ACIDENTE_TRABALHO": "LABOR",
                "EQUIPARACAO_SALARIAL": "LABOR",
                "DEMISSAO_SEM_JUSTA_CAUSA": "LABOR",
                "FGTS": "LABOR",
                "SEGURO_DESEMPREGO": "LABOR"
            };
            return typeMapping[caseType] || "OTHER";
        };

        form.reset({
            title: caseItem.title,
            description: caseItem.description || '',
            type: mapCaseTypeToFormType(caseItem.type),
            priority: "MEDIUM", // Default priority since Case interface doesn't have this field
            clientId: caseItem.clientId,
            courtName: '', // Default since Case interface doesn't have this field
            processNumber: caseItem.number || '',
            judge: '', // Default since Case interface doesn't have this field
            prosecutor: '', // Default since Case interface doesn't have this field
            initialValue: caseItem.value || undefined,
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        form.reset({
            type: "CIVIL",
            priority: "MEDIUM",
        });
        setSelectedCase(null);
    };

    const CaseForm = ({ onSubmit, submitText }: { onSubmit: (data: CaseFormData) => void, submitText: string }) => (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título do Caso</FormLabel>
                                <FormControl>
                                    <Input placeholder="Título do caso" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o cliente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Descrição detalhada do caso" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prioridade</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a prioridade" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="LOW">Baixa</SelectItem>
                                        <SelectItem value="MEDIUM">Média</SelectItem>
                                        <SelectItem value="HIGH">Alta</SelectItem>
                                        <SelectItem value="URGENT">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="courtName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tribunal/Vara</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do tribunal ou vara" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="processNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número do Processo</FormLabel>
                                <FormControl>
                                    <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="judge"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Juiz Responsável</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do juiz" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="prosecutor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Promotor/Advogado da Parte Contrária</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do promotor/advogado" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="initialValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Inicial da Causa (R$)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                        setIsCreateDialogOpen(false);
                        setIsEditDialogOpen(false);
                    }}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {submitText}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Casos</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os casos jurídicos
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Caso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Novo Caso</DialogTitle>
                            <DialogDescription>
                                Adicione um novo caso ao sistema
                            </DialogDescription>
                        </DialogHeader>
                        <CaseForm onSubmit={handleCreateCase} submitText="Criar Caso" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Casos Ativos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cases.filter(c => c.status === 'DRAFT' || c.status === 'ACTIVE').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Casos Fechados</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cases.filter(c => c.status === 'CLOSED').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Casos Arquivados</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {cases.filter(c => c.status === 'ARCHIVED').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Casos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cases.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros e Busca */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                        Use os filtros abaixo para encontrar casos específicos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por título, descrição ou número do processo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="DRAFT">Rascunho</SelectItem>
                                <SelectItem value="ACTIVE">Ativo</SelectItem>
                                <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                                <SelectItem value="CLOSED">Fechado</SelectItem>
                                <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Casos */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Casos</CardTitle>
                    <CardDescription>
                        {cases.length} casos encontrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Carregando casos...</span>
                        </div>
                    ) : cases.length === 0 ? (
                        <div className="text-center py-8">
                            <Gavel className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum caso encontrado</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Comece criando um novo caso.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Prioridade</TableHead>
                                        <TableHead>Criado em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cases.map((caseItem) => (
                                        <TableRow key={caseItem.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Gavel className="h-4 w-4 text-blue-600" />
                                                    <span>{caseItem.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{caseItem.client?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {typeLabels[caseItem.type as keyof typeof typeLabels] || caseItem.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[caseItem.status as keyof typeof statusColors]}>
                                                    {caseItem.status === 'DRAFT' ? 'Rascunho' :
                                                        caseItem.status === 'ACTIVE' ? 'Ativo' :
                                                            caseItem.status === 'SUSPENDED' ? 'Suspenso' :
                                                                caseItem.status === 'CLOSED' ? 'Fechado' : 'Arquivado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={priorityColors.MEDIUM}>
                                                    Média
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(caseItem.createdAt), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(caseItem)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver Detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Documentos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            Timeline
                                                        </DropdownMenuItem>
                                                        {caseItem.status !== 'CLOSED' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleChangeStatus(caseItem, 'CLOSED')}
                                                            >
                                                                <Gavel className="mr-2 h-4 w-4" />
                                                                Fechar Caso
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteCase(caseItem)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Paginação */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Página {currentPage} de {totalPages}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Caso</DialogTitle>
                        <DialogDescription>
                            Altere as informações do caso
                        </DialogDescription>
                    </DialogHeader>
                    <CaseForm onSubmit={handleEditCase} submitText="Salvar Alterações" />
                </DialogContent>
            </Dialog>
        </div>
    );
};
