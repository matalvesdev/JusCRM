import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { apiService } from '@/services/api';
import type { Activity } from '@/types';
import {
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Camera,
    Save,
    Key,
    Activity as ActivityComponent,
    Loader2
} from 'lucide-react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    bio?: string;
    role: string;
    createdAt: string;
    lastLogin?: string;
    avatar?: string;
}

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editForm, setEditForm] = useState<UserProfile | null>(null);

    // Carregar dados do perfil ao montar o componente
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setInitialLoading(true);
                const [profileData, activitiesData] = await Promise.all([
                    apiService.getProfile(),
                    apiService.getProfileActivities(5)
                ]);

                setProfile(profileData);
                setEditForm(profileData);
                setActivities(activitiesData);
            } catch (error) {
                console.error('Erro ao carregar perfil:', error);
                // Fallback para dados do contexto de auth em caso de erro
                if (user) {
                    const fallbackProfile: UserProfile = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        createdAt: new Date().toISOString(),
                    };
                    setProfile(fallbackProfile);
                    setEditForm(fallbackProfile);
                }
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSave = async () => {
        if (!editForm) return;

        setLoading(true);
        try {
            const updatedProfile = await apiService.updateProfile({
                name: editForm.name,
                phone: editForm.phone,
                address: editForm.address,
                bio: editForm.bio,
            });

            setProfile(updatedProfile);
            setEditForm(updatedProfile);
            setIsEditing(false);

            // TODO: Mostrar toast de sucesso
            console.log('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            // TODO: Mostrar toast de erro
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    };

    const updateEditForm = (field: keyof UserProfile, value: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, [field]: value });
    };

    const getRoleBadge = (role: string) => {
        const roleMap = {
            admin: { label: 'Administrador', variant: 'destructive' as const },
            lawyer: { label: 'Advogado', variant: 'default' as const },
            assistant: { label: 'Assistente', variant: 'secondary' as const }
        };

        const roleInfo = roleMap[role as keyof typeof roleMap] || { label: role, variant: 'secondary' as const };
        return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
    };

    return (
        <MainLayout>
            <div className="container mx-auto py-6 space-y-6">
                {initialLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Carregando perfil...</span>
                    </div>
                ) : !profile ? (
                    <div className="text-center py-8">
                        <p>Erro ao carregar dados do perfil.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold">Meu Perfil</h1>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} variant="outline">
                                    <UserIcon className="h-4 w-4 mr-2" />
                                    Editar Perfil
                                </Button>
                            ) : (
                                <div className="space-x-2">
                                    <Button onClick={handleCancel} variant="outline">
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSave} disabled={loading}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Informações Principais */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Informações Pessoais</CardTitle>
                                        <CardDescription>
                                            Gerencie suas informações básicas e preferências
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="name">Nome Completo</Label>
                                                {isEditing && editForm ? (
                                                    <Input
                                                        id="name"
                                                        value={editForm.name}
                                                        onChange={(e) => updateEditForm('name', e.target.value)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <div className="mt-1 p-2 bg-gray-50 rounded">{profile.name}</div>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                {isEditing && editForm ? (
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => updateEditForm('email', e.target.value)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <div className="mt-1 p-2 bg-gray-50 rounded flex items-center">
                                                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                                        {profile.email}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="phone">Telefone</Label>
                                                {isEditing && editForm ? (
                                                    <Input
                                                        id="phone"
                                                        value={editForm.phone || ''}
                                                        onChange={(e) => updateEditForm('phone', e.target.value)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <div className="mt-1 p-2 bg-gray-50 rounded flex items-center">
                                                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                                        {profile.phone || 'Não informado'}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="address">Endereço</Label>
                                                {isEditing && editForm ? (
                                                    <Input
                                                        id="address"
                                                        value={editForm.address || ''}
                                                        onChange={(e) => updateEditForm('address', e.target.value)}
                                                        className="mt-1"
                                                    />
                                                ) : (
                                                    <div className="mt-1 p-2 bg-gray-50 rounded flex items-center">
                                                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                                        {profile.address || 'Não informado'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="bio">Biografia</Label>
                                            {isEditing && editForm ? (
                                                <Textarea
                                                    id="bio"
                                                    value={editForm.bio || ''}
                                                    onChange={(e) => updateEditForm('bio', e.target.value)}
                                                    rows={3}
                                                    className="mt-1"
                                                    placeholder="Conte um pouco sobre você e sua experiência..."
                                                />
                                            ) : (
                                                <div className="mt-1 p-2 bg-gray-50 rounded">
                                                    {profile.bio || 'Nenhuma biografia adicionada'}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar com Avatar e Informações do Sistema */}
                            <div className="space-y-6">
                                {/* Avatar e Informações Básicas */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative">
                                                <Avatar className="h-24 w-24">
                                                    {profile.avatar ? (
                                                        <img src={profile.avatar} alt={profile.name} />
                                                    ) : (
                                                        <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                                            {profile.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </Avatar>
                                                {isEditing && (
                                                    <Button
                                                        size="sm"
                                                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                                                        variant="outline"
                                                    >
                                                        <Camera className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-lg">{profile.name}</h3>
                                                <div className="mt-2">
                                                    {getRoleBadge(profile.role)}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Informações do Sistema */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Shield className="h-5 w-5 mr-2" />
                                            Informações do Sistema
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Membro desde:</span>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Último acesso:</span>
                                            <div className="flex items-center text-sm">
                                                <ActivityComponent className="h-4 w-4 mr-1" />
                                                {profile.lastLogin ?
                                                    new Date(profile.lastLogin).toLocaleString('pt-BR') :
                                                    'Nunca'
                                                }
                                            </div>
                                        </div>

                                        <Separator />

                                        <ChangePasswordDialog>
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Key className="h-4 w-4 mr-2" />
                                                Alterar Senha
                                            </Button>
                                        </ChangePasswordDialog>
                                    </CardContent>
                                </Card>

                                {/* Atividades Recentes */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Atividades Recentes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            {activities.length > 0 ? (
                                                activities.map((activity, index) => (
                                                    <div key={index} className="p-2 bg-blue-50 rounded">
                                                        <div className="font-medium">{activity.description}</div>
                                                        <div className="text-gray-600">
                                                            {new Date(activity.createdAt).toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <>
                                                    <div className="p-2 bg-blue-50 rounded">
                                                        <div className="font-medium">Login realizado</div>
                                                        <div className="text-gray-600">Hoje às 14:30</div>
                                                    </div>
                                                    <div className="p-2 bg-green-50 rounded">
                                                        <div className="font-medium">Caso atualizado</div>
                                                        <div className="text-gray-600">Ontem às 16:45</div>
                                                    </div>
                                                    <div className="p-2 bg-yellow-50 rounded">
                                                        <div className="font-medium">Documento enviado</div>
                                                        <div className="text-gray-600">25/06 às 10:20</div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
};
