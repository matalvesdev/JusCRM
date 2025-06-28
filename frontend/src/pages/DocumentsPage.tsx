import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Upload,
    FileText,
    Download,
    Trash2,
    Plus,
    Search,
    X,
    File,
    FolderOpen,
    Calendar,
    User
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '@/services/api';
import type { Document, Case } from '@/types';

const documentTypeLabels = {
    CONTRACT: 'Contrato',
    PROCURATION: 'Procuração',
    EVIDENCE: 'Prova',
    PETITION: 'Petição',
    DECISION: 'Decisão',
    PROTOCOL: 'Protocolo',
    OTHER: 'Outro'
};

const documentTypeBadgeColors = {
    CONTRACT: 'bg-blue-100 text-blue-800',
    PROCURATION: 'bg-purple-100 text-purple-800',
    EVIDENCE: 'bg-yellow-100 text-yellow-800',
    PETITION: 'bg-green-100 text-green-800',
    DECISION: 'bg-red-100 text-red-800',
    PROTOCOL: 'bg-gray-100 text-gray-800',
    OTHER: 'bg-orange-100 text-orange-800'
};

export const DocumentsPage: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        caseId: ''
    });
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); const [uploadData, setUploadData] = useState<{
        name: string;
        type: Document['type'];
        caseId: string;
    }>({
        name: '',
        type: 'OTHER',
        caseId: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null); useEffect(() => {
        loadDocuments();
        loadCases();
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [pagination.page, filters]);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const params = {
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key as keyof typeof params] === '') {
                    delete params[key as keyof typeof params];
                }
            }); const response = await apiService.getDocuments(params);
            setDocuments(response.data || []);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            toast.error('Erro ao carregar documentos');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCases = async () => {
        try {
            const response = await apiService.getCases({ limit: 100 });
            setCases(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar casos:', error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadData(prev => ({
                ...prev,
                name: file.name.split('.')[0] // Remove extension
            }));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadData.name || !uploadData.type) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('name', uploadData.name);
            formData.append('type', uploadData.type);
            if (uploadData.caseId) {
                formData.append('caseId', uploadData.caseId);
            }

            await apiService.uploadDocument(selectedFile, {
                name: uploadData.name,
                type: uploadData.type,
                caseId: uploadData.caseId || undefined
            });

            toast.success('Documento enviado com sucesso!');
            setIsUploadDialogOpen(false);
            resetUploadForm();
            loadDocuments();
        } catch (error) {
            console.error('Erro ao enviar documento:', error);
            toast.error('Erro ao enviar documento');
        }
    }; const handleDownload = async (_documentId: string, filename: string) => {
        try {
            // The downloadDocument method returns a URL, not a blob
            const downloadUrl = apiService.downloadDocument(filename);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar documento:', error);
            toast.error('Erro ao baixar documento');
        }
    };

    const handleDelete = async (documentId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
            return;
        }

        try {
            await apiService.deleteDocument(documentId);
            toast.success('Documento excluído com sucesso!');
            loadDocuments();
        } catch (error) {
            console.error('Erro ao excluir documento:', error);
            toast.error('Erro ao excluir documento');
        }
    };

    const resetUploadForm = () => {
        setSelectedFile(null);
        setUploadData({
            name: '',
            type: 'OTHER',
            caseId: ''
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            caseId: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return <FileText className="h-4 w-4 text-red-600" />;
            case 'doc':
            case 'docx':
                return <FileText className="h-4 w-4 text-blue-600" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <File className="h-4 w-4 text-green-600" />;
            default:
                return <File className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
                    <p className="text-muted-foreground">
                        Gerencie documentos e arquivos dos casos
                    </p>
                </div>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Enviar Documento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Enviar Novo Documento</DialogTitle>
                            <DialogDescription>
                                Selecione um arquivo e preencha as informações do documento.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="file">Arquivo *</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        ref={fileInputRef}
                                        id="file"
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                    />
                                </div>
                                {selectedFile && (
                                    <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                                        {getFileIcon(selectedFile.name)}
                                        <span className="text-sm">{selectedFile.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({formatFileSize(selectedFile.size)})
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Document Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Documento *</Label>
                                <Input
                                    id="name"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Digite o nome do documento"
                                />
                            </div>

                            {/* Document Type */}
                            <div className="space-y-2">
                                <Label>Tipo do Documento *</Label>
                                <Select
                                    value={uploadData.type}
                                    onValueChange={(value) => setUploadData(prev => ({ ...prev, type: value as Document['type'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(documentTypeLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Case Selection */}
                            <div className="space-y-2">
                                <Label>Caso (opcional)</Label>
                                <Select
                                    value={uploadData.caseId}
                                    onValueChange={(value) => setUploadData(prev => ({ ...prev, caseId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um caso" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Nenhum caso específico</SelectItem>
                                        {cases.map((caseItem) => (
                                            <SelectItem key={caseItem.id} value={caseItem.id}>
                                                {caseItem.title} - {caseItem.client?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleUpload} disabled={!selectedFile || !uploadData.name}>
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nome ou descrição..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={filters.type}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os tipos</SelectItem>
                                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Caso</Label>
                            <Select
                                value={filters.caseId}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, caseId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os casos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os casos</SelectItem>
                                    {cases.map((caseItem) => (
                                        <SelectItem key={caseItem.id} value={caseItem.id}>
                                            {caseItem.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                <X className="h-4 w-4 mr-2" />
                                Limpar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentos ({pagination.total})</CardTitle>
                    <CardDescription>
                        Lista de todos os documentos cadastrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-12 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                Nenhum documento encontrado
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Comece enviando seu primeiro documento.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Documento</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Caso</TableHead>
                                        <TableHead>Enviado</TableHead>
                                        <TableHead>Tamanho</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((document) => (
                                        <TableRow key={document.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getFileIcon(document.filename)}
                                                    <div>
                                                        <div className="font-medium">{document.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {document.filename}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={documentTypeBadgeColors[document.type]}>
                                                    {documentTypeLabels[document.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {document.case ? (
                                                    <div>
                                                        <div className="font-medium">{document.case.title}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {document.case.client?.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {format(new Date(document.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{document.uploadedBy?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatFileSize(document.size)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownload(document.id, document.filename)}
                                                    >
                                                        <Download className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDelete(document.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between space-x-2 py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Página {pagination.page} de {pagination.pages} ({pagination.total} documentos)
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page <= 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page >= pagination.pages}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
