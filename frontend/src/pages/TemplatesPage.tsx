import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    Search,
    FileText,
    Edit,
    Copy,
    Trash2,
    Download,
    MoreHorizontal,
    Tag
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    generateDocument
} from '@/services/api';
import type { Template, TemplateType, TemplateCategory } from '@/types';

// Alias para facilitar o uso
const templatesApi = {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    generateDocument
};

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
    { value: 'PETITION', label: 'Petição' },
    { value: 'CONTRACT', label: 'Contrato' },
    { value: 'LETTER', label: 'Carta' },
    { value: 'PROCURATION', label: 'Procuração' },
    { value: 'MOTION', label: 'Requerimento' },
    { value: 'APPEAL', label: 'Recurso' },
    { value: 'AGREEMENT', label: 'Acordo' },
    { value: 'EMAIL', label: 'E-mail' },
    { value: 'NOTIFICATION', label: 'Notificação' },
    { value: 'OTHER', label: 'Outro' },
];

const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
    { value: 'LABOR_LAW', label: 'Direito do Trabalho' },
    { value: 'CIVIL_LAW', label: 'Direito Civil' },
    { value: 'CORPORATE_LAW', label: 'Direito Empresarial' },
    { value: 'FAMILY_LAW', label: 'Direito de Família' },
    { value: 'CRIMINAL_LAW', label: 'Direito Penal' },
    { value: 'ADMINISTRATIVE', label: 'Direito Administrativo' },
    { value: 'GENERAL', label: 'Geral' },
];

interface TemplateVariable {
    name: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'boolean' | 'select';
    required: boolean;
    defaultValue?: string;
    options?: string[];
}

interface CreateTemplateForm {
    name: string;
    description: string;
    type: TemplateType;
    category: TemplateCategory;
    content: string;
    variables: TemplateVariable[];
    isPublic: boolean;
    tags: string[];
}

export const TemplatesPage: React.FC = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    const [createForm, setCreateForm] = useState<CreateTemplateForm>({
        name: '',
        description: '',
        type: 'PETITION',
        category: 'GENERAL',
        content: '',
        variables: [],
        isPublic: false,
        tags: [],
    });

    const [newTag, setNewTag] = useState('');
    const [newVariable, setNewVariable] = useState<TemplateVariable>({
        name: '',
        label: '',
        type: 'text',
        required: false,
        defaultValue: '',
        options: [],
    });

    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const response = await templatesApi.getTemplates();
            setTemplates(response.templates);
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao carregar templates',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const filterTemplates = useCallback(() => {
        let filtered = templates;

        if (searchTerm) {
            filtered = filtered.filter(template =>
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedType !== 'all') {
            filtered = filtered.filter(template => template.type === selectedType);
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(template => template.category === selectedCategory);
        }

        setFilteredTemplates(filtered);
    }, [templates, searchTerm, selectedType, selectedCategory]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useEffect(() => {
        filterTemplates();
    }, [filterTemplates]);

    const handleCreateTemplate = async () => {
        try {
            await templatesApi.createTemplate(createForm);
            toast({
                title: 'Sucesso',
                description: 'Template criado com sucesso',
            });
            setIsCreateDialogOpen(false);
            resetCreateForm();
            loadTemplates();
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao criar template',
                variant: 'destructive',
            });
        }
    };

    const handleEditTemplate = async () => {
        if (!selectedTemplate) return;

        try {
            await templatesApi.updateTemplate(selectedTemplate.id, createForm);
            toast({
                title: 'Sucesso',
                description: 'Template atualizado com sucesso',
            });
            setIsEditDialogOpen(false);
            setSelectedTemplate(null);
            resetCreateForm();
            loadTemplates();
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao atualizar template',
                variant: 'destructive',
            });
        }
    };

    const handleDuplicateTemplate = async (template: Template) => {
        try {
            await templatesApi.duplicateTemplate(template.id, `${template.name} (Cópia)`);
            toast({
                title: 'Sucesso',
                description: 'Template duplicado com sucesso',
            });
            loadTemplates();
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao duplicar template',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        try {
            await templatesApi.deleteTemplate(templateId);
            toast({
                title: 'Sucesso',
                description: 'Template excluído com sucesso',
            });
            loadTemplates();
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao excluir template',
                variant: 'destructive',
            });
        }
    };

    const handleGenerateDocument = async (templateId: string) => {
        try {
            await templatesApi.generateDocument({
                templateId,
                variableValues: {},
                documentName: 'Documento Gerado',
            });
            toast({
                title: 'Sucesso',
                description: 'Documento gerado com sucesso',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Erro ao gerar documento',
                variant: 'destructive',
            });
        }
    };

    const resetCreateForm = () => {
        setCreateForm({
            name: '',
            description: '',
            type: 'PETITION',
            category: 'GENERAL',
            content: '',
            variables: [],
            isPublic: false,
            tags: [],
        });
    };

    const openEditDialog = (template: Template) => {
        setSelectedTemplate(template);
        setCreateForm({
            name: template.name,
            description: template.description || '',
            type: template.type,
            category: template.category,
            content: template.content,
            variables: template.variables as TemplateVariable[],
            isPublic: template.isPublic,
            tags: template.tags,
        });
        setIsEditDialogOpen(true);
    };

    const addTag = () => {
        if (newTag.trim() && !createForm.tags.includes(newTag.trim())) {
            setCreateForm(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setCreateForm(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const addVariable = () => {
        if (newVariable.name.trim() && newVariable.label.trim()) {
            setCreateForm(prev => ({
                ...prev,
                variables: [...prev.variables, { ...newVariable }]
            }));
            setNewVariable({
                name: '',
                label: '',
                type: 'text',
                required: false,
                defaultValue: '',
                options: [],
            });
        }
    };

    const removeVariable = (index: number) => {
        setCreateForm(prev => ({
            ...prev,
            variables: prev.variables.filter((_, i) => i !== index)
        }));
    };

    const getTypeLabel = (type: TemplateType) => {
        return TEMPLATE_TYPES.find(t => t.value === type)?.label || type;
    };

    const getCategoryLabel = (category: TemplateCategory) => {
        return TEMPLATE_CATEGORIES.find(c => c.value === category)?.label || category;
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                        <p className="text-muted-foreground">
                            Gerencie templates de documentos jurídicos
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Template</DialogTitle>
                            </DialogHeader>

                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                                    <TabsTrigger value="variables">Variáveis</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome</Label>
                                            <Input
                                                id="name"
                                                value={createForm.name}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Nome do template"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="type">Tipo</Label>
                                            <Select
                                                value={createForm.type}
                                                onValueChange={(value: TemplateType) =>
                                                    setCreateForm(prev => ({ ...prev, type: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TEMPLATE_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Categoria</Label>
                                            <Select
                                                value={createForm.category}
                                                onValueChange={(value: TemplateCategory) =>
                                                    setCreateForm(prev => ({ ...prev, category: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TEMPLATE_CATEGORIES.map((category) => (
                                                        <SelectItem key={category.value} value={category.value}>
                                                            {category.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                <input
                                                    type="checkbox"
                                                    checked={createForm.isPublic}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                                    className="mr-2"
                                                />
                                                Template público
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrição</Label>
                                        <Textarea
                                            id="description"
                                            value={createForm.description}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descrição do template"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tags</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                placeholder="Nova tag"
                                                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                            />
                                            <Button type="button" onClick={addTag}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {createForm.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(tag)}
                                                        className="ml-2 text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="content" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Conteúdo do Template</Label>
                                        <Textarea
                                            id="content"
                                            value={createForm.content}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Conteúdo do template..."
                                            rows={15}
                                            className="font-mono"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Use {'{{variableName}}'} para inserir variáveis no template
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="variables" className="space-y-4">
                                    <div className="border rounded-lg p-4 space-y-4">
                                        <h4 className="font-semibold">Adicionar Nova Variável</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="varName">Nome da Variável</Label>
                                                <Input
                                                    id="varName"
                                                    value={newVariable.name}
                                                    onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="nomeVariavel"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="varLabel">Rótulo</Label>
                                                <Input
                                                    id="varLabel"
                                                    value={newVariable.label}
                                                    onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                                                    placeholder="Nome da Variável"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="varType">Tipo</Label>
                                                <Select
                                                    value={newVariable.type}
                                                    onValueChange={(value: 'text' | 'date' | 'number' | 'boolean' | 'select') =>
                                                        setNewVariable(prev => ({ ...prev, type: value }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Texto</SelectItem>
                                                        <SelectItem value="date">Data</SelectItem>
                                                        <SelectItem value="number">Número</SelectItem>
                                                        <SelectItem value="boolean">Sim/Não</SelectItem>
                                                        <SelectItem value="select">Seleção</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>
                                                    <input
                                                        type="checkbox"
                                                        checked={newVariable.required}
                                                        onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                                                        className="mr-2"
                                                    />
                                                    Obrigatória
                                                </Label>
                                            </div>

                                            <div className="space-y-2">
                                                <Button type="button" onClick={addVariable} className="w-full">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Variáveis do Template</h4>
                                        {createForm.variables.length === 0 ? (
                                            <p className="text-muted-foreground">Nenhuma variável adicionada</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {createForm.variables.map((variable, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div>
                                                            <span className="font-medium">{variable.label}</span>
                                                            <span className="text-muted-foreground ml-2">({variable.name})</span>
                                                            <Badge variant="outline" className="ml-2">{variable.type}</Badge>
                                                            {variable.required && <Badge variant="destructive" className="ml-2">Obrigatória</Badge>}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeVariable(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        resetCreateForm();
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreateTemplate}>
                                    Criar Template
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Buscar templates..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    {TEMPLATE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as categorias</SelectItem>
                                    {TEMPLATE_CATEGORIES.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Templates */}
                {loading ? (
                    <div className="text-center py-8">
                        <p>Carregando templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                            <p className="text-muted-foreground mb-4">
                                {templates.length === 0
                                    ? 'Comece criando seu primeiro template'
                                    : 'Tente ajustar os filtros de busca'
                                }
                            </p>
                            {templates.length === 0 && (
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeiro Template
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <div className="flex gap-2">
                                                <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                                                <Badge variant="secondary">{getCategoryLabel(template.category)}</Badge>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleGenerateDocument(template.id)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Gerar Documento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {template.description && (
                                        <p className="text-muted-foreground text-sm mb-3">
                                            {template.description}
                                        </p>
                                    )}

                                    {template.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {template.tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>
                                            {(template.variables as TemplateVariable[])?.length || 0} variáveis
                                        </span>
                                        <span>
                                            {template.isPublic ? 'Público' : 'Privado'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Dialog de Edição */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Template</DialogTitle>
                        </DialogHeader>

                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                                <TabsTrigger value="variables">Variáveis</TabsTrigger>
                            </TabsList>

                            {/* Mesmo conteúdo do diálogo de criação */}
                            <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nome</Label>
                                        <Input
                                            id="edit-name"
                                            value={createForm.name}
                                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Nome do template"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-type">Tipo</Label>
                                        <Select
                                            value={createForm.type}
                                            onValueChange={(value: TemplateType) =>
                                                setCreateForm(prev => ({ ...prev, type: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEMPLATE_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-category">Categoria</Label>
                                        <Select
                                            value={createForm.category}
                                            onValueChange={(value: TemplateCategory) =>
                                                setCreateForm(prev => ({ ...prev, category: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEMPLATE_CATEGORIES.map((category) => (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        {category.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            <input
                                                type="checkbox"
                                                checked={createForm.isPublic}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                                className="mr-2"
                                            />
                                            Template público
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descrição</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Descrição do template"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Nova tag"
                                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                        />
                                        <Button type="button" onClick={addTag}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {createForm.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-2 text-xs"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="content" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-content">Conteúdo do Template</Label>
                                    <Textarea
                                        id="edit-content"
                                        value={createForm.content}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Conteúdo do template..."
                                        rows={15}
                                        className="font-mono"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Use {'{{variableName}}'} para inserir variáveis no template
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="variables" className="space-y-4">
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h4 className="font-semibold">Adicionar Nova Variável</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-varName">Nome da Variável</Label>
                                            <Input
                                                id="edit-varName"
                                                value={newVariable.name}
                                                onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="nomeVariavel"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-varLabel">Rótulo</Label>
                                            <Input
                                                id="edit-varLabel"
                                                value={newVariable.label}
                                                onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                                                placeholder="Nome da Variável"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-varType">Tipo</Label>
                                            <Select
                                                value={newVariable.type}
                                                onValueChange={(value: 'text' | 'date' | 'number' | 'boolean' | 'select') =>
                                                    setNewVariable(prev => ({ ...prev, type: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Texto</SelectItem>
                                                    <SelectItem value="date">Data</SelectItem>
                                                    <SelectItem value="number">Número</SelectItem>
                                                    <SelectItem value="boolean">Sim/Não</SelectItem>
                                                    <SelectItem value="select">Seleção</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                <input
                                                    type="checkbox"
                                                    checked={newVariable.required}
                                                    onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                                                    className="mr-2"
                                                />
                                                Obrigatória
                                            </Label>
                                        </div>

                                        <div className="space-y-2">
                                            <Button type="button" onClick={addVariable} className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold">Variáveis do Template</h4>
                                    {createForm.variables.length === 0 ? (
                                        <p className="text-muted-foreground">Nenhuma variável adicionada</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {createForm.variables.map((variable, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <span className="font-medium">{variable.label}</span>
                                                        <span className="text-muted-foreground ml-2">({variable.name})</span>
                                                        <Badge variant="outline" className="ml-2">{variable.type}</Badge>
                                                        {variable.required && <Badge variant="destructive" className="ml-2">Obrigatória</Badge>}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeVariable(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditDialogOpen(false);
                                    setSelectedTemplate(null);
                                    resetCreateForm();
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleEditTemplate}>
                                Salvar Alterações
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
};
