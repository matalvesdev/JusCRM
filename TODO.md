# JusCRM - TODO List

## ✅ CONCLUÍDO - Sistema Base Funcionando

### Core Features Implementadas

- [x] **Autenticação completa** (JWT, login/logout, rotas protegidas)
- [x] **CRUD completo de Clientes** (filtros, paginação, validação)
- [x] **CRUD completo de Casos** (status, tipos, timeline, integração)
- [x] **Sistema de Documentos** (upload, download, organização, controle acesso)
- [x] **Sistema de Agenda** (compromissos, integração com casos, filtros)
- [x] **Dashboard** (estatísticas, métricas, gráficos)
- [x] **Interface responsiva** (shadcn/ui, componentes modernos)
- [x] **Integração Frontend-Backend** (todas as APIs funcionando)
- [x] **Banco de dados** (configurado com dados de teste)
- [x] **Sistema de Notificações** (CRUD, contadores, interface completa)
- [x] **Busca Global** (unificada, autocomplete, filtros por tipo)
- [x] **Sistema de Relatórios** (CRUD, estatísticas, interface completa)
- [x] **Sistema de Templates** (CRUD, variáveis, geração de documentos)

### Ambiente de Desenvolvimento

- [x] Backend rodando em `http://localhost:3333`
- [x] Frontend rodando em `http://localhost:5173`
- [x] Documentação API em `/docs`
- [x] Credenciais de teste configuradas

---

## 🎯 PRÓXIMAS FUNCIONALIDADES - PRIORIDADE ALTA

### 1. Landing Page Institucional ✅

**Objetivo:** Criar página inicial para visitantes e potenciais clientes
**Estimativa:** 1-2 semanas
**Status:** CONCLUÍDO

- [x] **Design da Landing Page**

  - [x] Hero section com call-to-action
  - [x] Seção "Sobre o JusCRM"
  - [x] Recursos/funcionalidades principais
  - [x] Depoimentos/testimonials
  - [x] Seção de preços/planos
  - [x] Formulário de contato
  - [x] Footer com links importantes

- [x] **Conteúdo e Copy**

  - [x] Textos persuasivos
  - [x] Imagens/ilustrações
  - [x] Ícones para features
  - [x] Integração com rotas do app

- [x] **Integração**
  - [x] Rota principal (/) direcionando para Landing Page
  - [x] Links para login e registro funcionando
  - [x] Responsividade implementada

### 2. Sistema de Perfil do Usuário ✅

**Objetivo:** Permitir que usuários gerenciem suas informações
**Estimativa:** 1 semana
**Status:** CONCLUÍDO

- [x] **Página de Perfil**

  - [x] Visualização de dados pessoais
  - [x] Edição de informações (nome, telefone, endereço, biografia)
  - [x] Avatar com inicial do nome
  - [x] Informações do sistema (data de criação, último acesso)
  - [x] Histórico de atividades (mockado)
  - [x] Interface responsiva e moderna

- [x] **Backend API**

  - [x] Endpoint GET /api/profile - buscar dados do perfil
  - [x] Endpoint PUT /api/profile - atualizar dados do perfil
  - [x] Endpoint POST /api/profile/change-password - alterar senha
  - [x] Validações de entrada e segurança
  - [x] Migração do banco com novos campos (phone, address, bio, lastLogin)

- [x] **Alteração de Senha**

  - [x] Dialog modal para alteração de senha
  - [x] Validação de senha atual
  - [x] Validação de complexidade da nova senha
  - [x] Confirmação de senha
  - [x] Hash seguro da senha no backend

- [x] **Integração Frontend-Backend**
  - [x] API calls funcionais
  - [x] Tratamento de erros
  - [x] Estados de loading
  - [x] Navegação no sidebar

### 3. Melhorias na Autenticação ✅

**Objetivo:** Tornar o sistema mais seguro e user-friendly
**Estimativa:** 1-2 semanas
**Status:** CONCLUÍDO

- [x] **Recuperação de Senha**

  - [x] Endpoint backend para reset
  - [x] Envio de email com token (logs em desenvolvimento)
  - [x] Página de redefinição
  - [x] Validação de token
  - [x] Integração frontend-backend
  - [x] Link na página de login

- [x] **Verificação de Email**

  - [x] Email de confirmação no registro (backend)
  - [x] Página de verificação (frontend)
  - [x] Reenvio de email (frontend)
  - [x] Integração completa

- [x] **Melhorias UX**
  - [x] Remember me checkbox (implementado)
  - [x] Logout automático por inatividade (hook 30min)
  - [x] Mensagens de erro melhoradas
  - [x] Expiração customizada do token (24h/30 dias)

### 4. Sistema de Notificações ✅

**Objetivo:** Manter usuários informados sobre prazos e atividades
**Estimativa:** 2-3 semanas
**Status:** CONCLUÍDO (Básico)

- [x] **Backend de Notificações**

  - [x] Modelo de notificações no banco (tipos, prioridades, relações)
  - [x] API para CRUD de notificações
  - [x] Endpoints de listagem, contagem e marcação como lida
  - [x] Autenticação e autorização

- [x] **Frontend de Notificações**

  - [x] Centro de notificações (dropdown)
  - [x] Badge com contador de não lidas
  - [x] Marca como lida/não lida
  - [x] Interface responsiva e moderna
  - [x] Diferentes tipos e prioridades visuais

- [ ] **Email Notifications (Próxima fase)**
  - [ ] Configuração SMTP
  - [ ] Templates de email
  - [ ] Envio automático de lembretes
  - [ ] Sistema de triggers automáticos

### 5. Busca Avançada Global ✅

**Objetivo:** Facilitar encontrar informações em todo o sistema
**Estimativa:** 2 semanas
**Status:** CONCLUÍDO

- [x] **Backend Search**

  - [x] Endpoint de busca unificada (/api/search)
  - [x] Endpoint de sugestões (/api/search/suggestions)
  - [x] Busca em clientes, casos, documentos, compromissos
  - [x] Paginação e filtros por tipo
  - [x] Validação de schemas Fastify
  - [x] Tipagem TypeScript completa
  - [ ] Indexação de conteúdo avançada (futuro)
  - [ ] Busca em texto de documentos (PDFs) (futuro)
  - [ ] Filtros avançados (data, status, etc.) (futuro)

- [x] **Frontend Search**
  - [x] Componente GlobalSearch completo
  - [x] Barra de busca global integrada no TopBar
  - [x] Autocomplete/suggestions em tempo real
  - [x] Filtros por tipo de conteúdo
  - [x] Interface responsiva com dropdown de resultados
  - [x] Destaque visual por tipo (ícones e badges)
  - [x] Estados de loading e resultados vazios
  - [x] Navegação por teclado (Enter/Escape)
  - [ ] Página de resultados dedicada (futuro)
  - [ ] Histórico de buscas (futuro)

---

## 🚀 FUNCIONALIDADES INTERMEDIÁRIAS

### 6. Sistema de Relatórios ✅

**Objetivo:** Gerar relatórios para análise de dados
**Estimativa:** 2-3 semanas
**Status:** CONCLUÍDO (Básico)

- [x] **Relatórios Backend**

  - [x] Modelo de relatórios no banco (tipos, formatos, status, relações)
  - [x] API CRUD completa para relatórios (/api/reports)
  - [x] Endpoint de estatísticas (/api/reports/stats)
  - [x] Endpoint de download de relatórios (/api/reports/:id/download)
  - [x] Validação de schemas Fastify e tipagem TypeScript
  - [x] Autenticação e autorização completas
  - [x] Estrutura preparada para geração assíncrona
  - [x] Sistema de filtros e paginação

- [x] **Interface de Relatórios**

  - [x] Página de relatórios completa (/app/reports)
  - [x] Dashboard com estatísticas visuais
  - [x] Diálogo de criação de relatórios
  - [x] Seleção de tipo, formato e período
  - [x] Lista com filtros avançados
  - [x] Interface de download e gerenciamento
  - [x] Estados de loading e tratamento de erros
  - [x] Integração com sidebar e navegação

- [ ] **Próximas Melhorias (Futuro)**
  - [ ] Implementar geração real de PDFs/Excel/CSV
  - [ ] Sistema de filas para processamento em background
  - [ ] Templates de relatórios personalizáveis
  - [ ] Preview de relatórios antes do download
  - [ ] Agendamento automático de relatórios
  - [ ] Relatórios com gráficos e visualizações avançadas

### 7. Sistema de Templates ✅

**Objetivo:** Padronizar documentos e comunicações
**Estimativa:** 2-3 semanas
**Status:** CONCLUÍDO

- [x] **Templates Backend**

  - [x] Modelo de templates no banco
  - [x] API CRUD para templates
  - [x] Sistema de variáveis
  - [x] Duplicação de templates
  - [x] Geração de documentos

- [x] **Frontend de Templates**
  - [x] Interface de listagem
  - [x] Formulário de criação/edição
  - [x] Sistema de filtros e busca
  - [x] Gestão de variáveis
  - [x] Tags e categorização
  - [x] Integração com sidebar e rotas

**Funcionalidades Implementadas:**

- CRUD completo de templates
- Sistema de tipos (Petição, Contrato, etc.)
- Categorias por área do direito
- Variáveis dinâmicas personalizáveis
- Tags para organização
- Templates públicos/privados
- Duplicação de templates
- Geração simulada de documentos
- Interface responsiva e moderna

**Próximas Melhorias (Futuro):**

- Editor WYSIWYG avançado
- Preview em tempo real
- Versionamento de templates
- Templates mais dinâmicos
- Integração com editor de documentos

### 8. Audit Trail e Logs ✅

**Objetivo:** Rastrear todas as ações do sistema
**Estimativa:** 1-2 semanas
**Status:** CONCLUÍDO

- [x] **Sistema de Auditoria**
  - [x] Log de todas as ações (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, DUPLICATE, GENERATE)
  - [x] Rastreamento de mudanças (dados antes/depois)
  - [x] Histórico por usuário (filtros por usuário, entidade, ação)
  - [x] Exportação de logs (API de listagem com paginação)
  - [x] API completa de auditoria (/api/audit, /api/audit/stats, /api/audit/:id)
  - [x] Integração em autenticação e templates
  - [x] Metadados completos (IP, User-Agent, timestamps)
  - [x] Sistema extensível para todas as entidades

### 9. Melhorias no Dashboard ✅

**Objetivo:** Tornar o dashboard mais informativo
**Estimativa:** 1 semana
**Status:** CONCLUÍDO

- [x] **Novos Widgets**

  - [x] Gráfico de casos por tempo (timeline)
  - [x] Top clientes por casos
  - [x] Prazos próximos do vencimento
  - [x] Atividades recentes melhoradas
  - [x] Estatísticas de auditoria

- [x] **Backend Endpoints**

  - [x] `/api/dashboard/cases-timeline` - Timeline de casos por período
  - [x] `/api/dashboard/top-clients` - Top clientes por número de casos
  - [x] `/api/dashboard/upcoming-deadlines` - Prazos próximos detalhados
  - [x] `/api/dashboard/recent-activities` - Atividades recentes com auditoria
  - [x] `/api/dashboard/audit-stats` - Estatísticas de logs de auditoria
  - [x] Correção de schema para usar `lawyerId` e `startDate` no modelo Appointment

- [x] **Frontend Widgets**

  - [x] Cards de estatísticas principais mantidos
  - [x] Widget de timeline de casos com dados mensais
  - [x] Widget de top clientes com ranking
  - [x] Widget de atividades recentes integrado com auditoria
  - [x] Widget de estatísticas de auditoria (ações, logins, etc.)
  - [x] Interface responsiva e moderna
  - [x] Integração com novos endpoints da API

- [ ] **Customização (Futuro)**
  - [ ] Widgets configuráveis
  - [ ] Layout personalizável
  - [ ] Filtros por período

---

## 📱 MELHORIAS UX/UI

### 10. PWA (Progressive Web App)

**Objetivo:** Funcionar como app nativo
**Estimativa:** 1-2 semanas

- [ ] **Configuração PWA**
  - [ ] Service worker
  - [ ] App manifest
  - [ ] Ícones para instalação
  - [ ] Funcionalidade offline básica

### 11. Melhorias Mobile

**Objetivo:** Otimizar para dispositivos móveis
**Estimativa:** 1-2 semanas

- [ ] **Layout Mobile**
  - [ ] Menu hambúrguer aprimorado
  - [ ] Navegação touch-friendly
  - [ ] Tabelas responsivas
  - [ ] Formulários otimizados

### 12. Acessibilidade

**Objetivo:** Tornar o sistema acessível a todos
**Estimativa:** 1 semana

- [ ] **WCAG Compliance**
  - [ ] Navegação por teclado
  - [ ] Screen reader support
  - [ ] Contraste de cores
  - [ ] Alt text em imagens

---

## 🔧 MELHORIAS TÉCNICAS

### 13. Testes Automatizados

**Objetivo:** Garantir qualidade e confiabilidade
**Estimativa:** 2-3 semanas

- [ ] **Backend Tests**

  - [ ] Unit tests (Jest)
  - [ ] Integration tests
  - [ ] API endpoint tests
  - [ ] Database tests

- [ ] **Frontend Tests**
  - [ ] Component tests (React Testing Library)
  - [ ] E2E tests (Playwright)
  - [ ] Visual regression tests
  - [ ] Coverage reports

### 14. Performance e Otimização

**Objetivo:** Melhorar velocidade e eficiência
**Estimativa:** 1-2 semanas

- [ ] **Backend Performance**

  - [ ] Query optimization
  - [ ] Database indexing
  - [ ] Caching (Redis)
  - [ ] API rate limiting

- [ ] **Frontend Performance**
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization
  - [ ] Bundle analysis

### 15. Segurança Avançada

**Objetivo:** Aumentar segurança do sistema
**Estimativa:** 1-2 semanas

- [ ] **Segurança Backend**

  - [ ] RBAC (Role-Based Access Control)
  - [ ] Encryption at rest
  - [ ] Security headers
  - [ ] Input validation

- [ ] **Auditoria de Segurança**
  - [ ] Vulnerability scanning
  - [ ] Penetration testing
  - [ ] Security best practices

---

## 🌐 INTEGRAÇÕES AVANÇADAS

### 16. Integração com Tribunais

**Objetivo:** Automatizar consulta de processos
**Estimativa:** 3-4 semanas

- [ ] **APIs de Tribunais**
  - [ ] Integração TRT/TST
  - [ ] Consulta de processos
  - [ ] Acompanhamento automático
  - [ ] Notificações de movimentação

### 17. Sistema Financeiro

**Objetivo:** Controle de honorários e pagamentos
**Estimativa:** 3-4 semanas

- [ ] **Gestão Financeira**
  - [ ] Controle de honorários
  - [ ] Geração de boletos/PIX
  - [ ] Fluxo de caixa
  - [ ] Relatórios financeiros

### 18. Integração Email

**Objetivo:** Automatizar comunicações
**Estimativa:** 2 semanas

- [ ] **Email Integration**
  - [ ] IMAP/SMTP configuration
  - [ ] Templates de email
  - [ ] Campanhas automáticas
  - [ ] Tracking de emails

---

## 📊 ANALYTICS E MONITORING

### 19. Analytics Avançado

**Objetivo:** Entender uso do sistema
**Estimativa:** 1-2 semanas

- [ ] **User Analytics**
  - [ ] Google Analytics/Mixpanel
  - [ ] User behavior tracking
  - [ ] Feature usage metrics
  - [ ] Conversion funnels

### 20. Error Tracking

**Objetivo:** Monitorar e corrigir erros
**Estimativa:** 1 semana

- [ ] **Error Monitoring**
  - [ ] Sentry integration
  - [ ] Error logging
  - [ ] Performance monitoring
  - [ ] Uptime monitoring

---

## 🏢 RECURSOS EMPRESARIAIS

### 21. Multi-tenancy

**Objetivo:** Suportar múltiplos escritórios
**Estimativa:** 4-6 semanas

- [ ] **Arquitetura Multi-tenant**
  - [ ] Separação por escritório
  - [ ] Banco de dados isolado
  - [ ] Customização por tenant
  - [ ] Billing separado

### 22. Sistema de Planos

**Objetivo:** Monetização do sistema
**Estimativa:** 2-3 semanas

- [ ] **Subscription System**
  - [ ] Planos de assinatura
  - [ ] Billing automático
  - [ ] Limitações por plano
  - [ ] Upgrade/downgrade

---

## 📱 DEVOPS E DEPLOY

### 23. CI/CD Pipeline

**Objetivo:** Automatizar deploy e testes
**Estimativa:** 1-2 semanas

- [ ] **Automation**
  - [ ] GitHub Actions
  - [ ] Automated testing
  - [ ] Automated deployment
  - [ ] Environment management

### 24. Containerização

**Objetivo:** Facilitar deploy e escalabilidade
**Estimativa:** 1 semana

- [ ] **Docker**
  - [ ] Dockerfile otimizado
  - [ ] Docker Compose
  - [ ] Multi-stage builds
  - [ ] Health checks

### 25. Cloud Deployment

**Objetivo:** Deploy em produção
**Estimativa:** 1-2 semanas

- [ ] **Production Setup**
  - [ ] Cloud deployment (AWS/Vercel)
  - [ ] Domain configuration
  - [ ] SSL certificates
  - [ ] Database backup
  - [ ] Monitoring setup

---

## 📈 ROADMAP SUGERIDO

### **Fase 1 (Próximas 4-6 semanas)** - UX Essencial

1. Landing Page Institucional
2. Sistema de Perfil do Usuário
3. Melhorias na Autenticação
4. Busca Avançada Global

### **Fase 2 (6-10 semanas)** - Funcionalidades Avançadas

5. Sistema de Notificações
6. Sistema de Relatórios
7. Audit Trail e Logs
8. Melhorias no Dashboard

### **Fase 3 (10-14 semanas)** - Qualidade e Performance

9. PWA e Melhorias Mobile
10. Testes Automatizados
11. Performance e Otimização
12. Acessibilidade

### **Fase 4 (14-20 semanas)** - Integrações e Empresa

13. Sistema de Templates
14. Integração Email
15. Analytics e Monitoring
16. Sistema Financeiro

### **Fase 5 (20+ semanas)** - Enterprise

17. Multi-tenancy
18. Integração com Tribunais
19. Sistema de Planos
20. Deploy em Produção

---

**Total Estimado:** 20-25 semanas (5-6 meses) para implementação completa
**Próximo Foco:** Itens 1-4 da Fase 1 (Landing Page + UX Essencial)
