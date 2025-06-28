import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, User, Briefcase, Calendar } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { searchGlobal, getSearchSuggestions } from '../services/api';
import type { GlobalSearchResponse, SearchSuggestion, ClientProfile, Case, Document, Appointment } from '../types';

interface GlobalSearchProps {
    className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<GlobalSearchResponse | null>(null);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [selectedType, setSelectedType] = useState<'ALL' | 'CLIENTS' | 'CASES' | 'DOCUMENTS' | 'APPOINTMENTS'>('ALL');

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Buscar sugestões enquanto digita
    const handleSuggestions = useCallback(async () => {
        if (query.length < 2) return;

        try {
            const response = await getSearchSuggestions(query, 5);
            setSuggestions(response.suggestions);
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
        }
    }, [query]);

    useEffect(() => {
        if (query.length > 2) {
            const timer = setTimeout(() => {
                handleSuggestions();
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
        }
    }, [query, handleSuggestions]);

    const handleSearch = async () => {
        if (query.length < 2) return;

        setIsLoading(true);
        try {
            const response = await searchGlobal(query, selectedType, 10, 1);
            setResults(response);
            setIsOpen(true);
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'client':
                return <User className="w-4 h-4" />;
            case 'case':
                return <Briefcase className="w-4 h-4" />;
            case 'document':
                return <FileText className="w-4 h-4" />;
            case 'appointment':
                return <Calendar className="w-4 h-4" />;
            default:
                return <Search className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'client':
                return 'bg-blue-100 text-blue-800';
            case 'case':
                return 'bg-green-100 text-green-800';
            case 'document':
                return 'bg-purple-100 text-purple-800';
            case 'appointment':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const totalResults = results
        ? results.results.clients.length +
        results.results.cases.length +
        results.results.documents.length +
        results.results.appointments.length
        : 0;

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Input de busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar clientes, casos, documentos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                    className="pl-10 pr-10"
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                            setResults(null);
                            setIsOpen(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}
            </div>

            {/* Dropdown de resultados */}
            {isOpen && (suggestions.length > 0 || results) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">

                    {/* Sugestões rápidas */}
                    {suggestions.length > 0 && !results && (
                        <div className="p-2">
                            <div className="text-xs text-gray-500 mb-2 px-2">Sugestões</div>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => {
                                        setQuery(suggestion.text);
                                        handleSearch();
                                    }}
                                >
                                    {getTypeIcon(suggestion.type)}
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{suggestion.text}</div>
                                        {suggestion.subtitle && (
                                            <div className="text-xs text-gray-500">{suggestion.subtitle}</div>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                                        {suggestion.type}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Resultados da busca */}
                    {results && (
                        <div className="p-2">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <div className="text-sm font-medium">
                                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {results.meta.executionTime}ms
                                </div>
                            </div>

                            {/* Filtros por tipo */}
                            <div className="flex gap-1 mb-3 px-2">
                                {['ALL', 'CLIENTS', 'CASES', 'DOCUMENTS', 'APPOINTMENTS'].map((type) => (
                                    <Button
                                        key={type}
                                        variant={selectedType === type ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs h-6"
                                        onClick={() => {
                                            setSelectedType(type as 'ALL' | 'CLIENTS' | 'CASES' | 'DOCUMENTS' | 'APPOINTMENTS');
                                            handleSearch();
                                        }}
                                    >
                                        {type === 'ALL' ? 'Todos' :
                                            type === 'CLIENTS' ? 'Clientes' :
                                                type === 'CASES' ? 'Casos' :
                                                    type === 'DOCUMENTS' ? 'Documentos' : 'Agenda'}
                                    </Button>
                                ))}
                            </div>

                            {/* Resultados de clientes */}
                            {results.results.clients.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 mb-2 px-2">Clientes</div>
                                    {results.results.clients.map((client: ClientProfile) => (
                                        <div key={client.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{client.name}</div>
                                                <div className="text-xs text-gray-500">{client.email}</div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                Cliente
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Resultados de casos */}
                            {results.results.cases.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 mb-2 px-2">Casos</div>
                                    {results.results.cases.map((case_: Case) => (
                                        <div key={case_.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <Briefcase className="w-4 h-4 text-green-500" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{case_.title}</div>
                                                <div className="text-xs text-gray-500">
                                                    {case_.number} • {case_.client?.name}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                Caso
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Resultados de documentos */}
                            {results.results.documents.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 mb-2 px-2">Documentos</div>
                                    {results.results.documents.map((doc: Document) => (
                                        <div key={doc.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <FileText className="w-4 h-4 text-purple-500" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{doc.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {doc.filename} • {doc.case?.title}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                                Documento
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Resultados de compromissos */}
                            {results.results.appointments.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 mb-2 px-2">Compromissos</div>
                                    {results.results.appointments.map((appointment: Appointment) => (
                                        <div key={appointment.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{appointment.title}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(appointment.startDate).toLocaleDateString()} • {appointment.case?.title}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                                Compromisso
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {totalResults === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <div className="text-sm">Nenhum resultado encontrado</div>
                                    <div className="text-xs">Tente usar termos diferentes</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-500">Buscando...</div>
                </div>
            )}
        </div>
    );
}
