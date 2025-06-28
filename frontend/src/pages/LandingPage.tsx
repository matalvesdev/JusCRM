import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const LandingPage: React.FC = () => {
    console.log('LandingPage com Button renderizando...');

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 100%)',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header/Navigation */}
            <header style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '60px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                            ⚖️ JusCRM
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: '32px' }}>
                        <a href="#features" style={{ color: '#64748b', textDecoration: 'none' }}>
                            Recursos
                        </a>
                        <a href="#pricing" style={{ color: '#64748b', textDecoration: 'none' }}>
                            Preços
                        </a>
                        <a href="#contact" style={{ color: '#64748b', textDecoration: 'none' }}>
                            Contato
                        </a>
                    </nav>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/login">
                            <Button variant="outline">Entrar</Button>
                        </Link>
                        <Link to="/register">
                            <Button>Começar Agora</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '24px',
                        lineHeight: '1.2'
                    }}>
                        O CRM ideal para<br />
                        <span style={{ color: '#3b82f6' }}>Escritórios de Advocacia</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#64748b',
                        marginBottom: '32px',
                        maxWidth: '600px',
                        margin: '0 auto 32px'
                    }}>
                        Gerencie clientes, casos, documentos e agenda em uma plataforma moderna e segura.
                        Especializado em Direito Trabalhista.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register">
                            <Button size="lg" className="px-8 py-3">
                                Começar Gratuitamente →
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="px-8 py-3">
                                Fazer Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '80px 20px', background: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            marginBottom: '16px'
                        }}>
                            Recursos Completos
                        </h2>
                        <p style={{
                            fontSize: '1.25rem',
                            color: '#64748b',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            Tudo que você precisa para gerenciar seu escritório de advocacia em um só lugar
                        </p>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '32px'
                    }}>
                        <div style={{
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#dbeafe',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                fontSize: '1.5rem'
                            }}>
                                👥
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                Gestão de Clientes
                            </h3>
                            <p style={{ color: '#64748b' }}>
                                Cadastro completo de clientes com histórico, documentos e comunicações centralizadas.
                            </p>
                        </div>

                        <div style={{
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#dcfce7',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                fontSize: '1.5rem'
                            }}>
                                📁
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                Controle de Casos
                            </h3>
                            <p style={{ color: '#64748b' }}>
                                Acompanhe processos, prazos, movimentações e documentos de cada caso em tempo real.
                            </p>
                        </div>

                        <div style={{
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#f3e8ff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                fontSize: '1.5rem'
                            }}>
                                📅
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                Agenda Inteligente
                            </h3>
                            <p style={{ color: '#64748b' }}>
                                Compromissos, audiências e prazos organizados com notificações automáticas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '80px 20px', background: '#3b82f6' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '24px'
                    }}>
                        Pronto para modernizar seu escritório?
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#bfdbfe',
                        marginBottom: '32px'
                    }}>
                        Junte-se a centenas de advogados que já transformaram sua prática com o JusCRM
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register">
                            <Button size="lg" variant="secondary" className="px-8 py-3">
                                Teste Gratuito por 30 Dias
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                                Já tenho conta
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#1f2937', color: 'white', padding: '48px 20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '32px',
                        marginBottom: '32px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>⚖️ JusCRM</span>
                            </div>
                            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                                A solução completa para gestão de escritórios de advocacia.
                                Especializado em Direito Trabalhista.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📧</span>
                                <span style={{ color: '#9ca3af' }}>contato@juscrm.com.br</span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Recursos</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#9ca3af' }}>
                                <li style={{ marginBottom: '8px' }}>Gestão de Clientes</li>
                                <li style={{ marginBottom: '8px' }}>Controle de Casos</li>
                                <li style={{ marginBottom: '8px' }}>Agenda</li>
                                <li style={{ marginBottom: '8px' }}>Relatórios</li>
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Suporte</h3>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#9ca3af' }}>
                                <li style={{ marginBottom: '8px' }}>Central de Ajuda</li>
                                <li style={{ marginBottom: '8px' }}>Contato</li>
                                <li style={{ marginBottom: '8px' }}>Termos de Uso</li>
                                <li style={{ marginBottom: '8px' }}>Privacidade</li>
                            </ul>
                        </div>
                    </div>

                    <div style={{
                        borderTop: '1px solid #374151',
                        paddingTop: '32px',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#9ca3af' }}>
                            © 2025 JusCRM. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
