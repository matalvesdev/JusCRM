# JusCRM - Sistema de Gestão para Escritórios de Advocacia

Um sistema completo de CRM (Customer Relationship Management) desenvolvido especificamente para escritórios de advocacia trabalhista, oferecendo gestão eficiente de clientes, casos, documentos e atividades jurídicas.

## 🎯 Objetivo

O JusCRM foi criado para simplificar e organizar o dia a dia de escritórios de advocacia, centralizando todas as informações dos clientes, casos e processos em uma plataforma moderna e intuitiva.

## ✨ Principais Funcionalidades

- 👥 **Gestão de Clientes** - Cadastro completo de pessoas físicas e jurídicas
- ⚖️ **Controle de Casos** - Organização de processos jurídicos por cliente e advogado
- 📄 **Gerenciamento de Documentos** - Upload e organização de arquivos por caso
- 📅 **Agenda Integrada** - Controle de audiências, reuniões e prazos
- 💰 **Controle Financeiro** - Gestão de honorários e despesas
- 📊 **Dashboard Executivo** - Visão geral das atividades do escritório
- 🔐 **Controle de Acesso** - Sistema de permissões por usuário

## 🏗️ Arquitetura do Sistema

O projeto está dividido em duas partes principais:

### 🔧 Backend

- **Node.js** com **TypeScript**
- **Fastify** como framework web
- **Prisma ORM** para banco de dados
- **PostgreSQL** como banco de dados
- **JWT** para autenticação
- **Validação** com schemas robustos

### 🎨 Frontend

- **React 19** com **TypeScript**
- **Vite** para desenvolvimento rápido
- **Tailwind CSS** para estilização
- **shadcn/ui** como biblioteca de componentes
- **React Router** para navegação
- **React Hook Form** + **Zod** para formulários

## 📁 Estrutura do Projeto

```
JusCRM/
├── backend/          # API e lógica de negócio
│   ├── src/
│   │   ├── routes/   # Rotas da API
│   │   ├── plugins/  # Plugins do Fastify
│   │   ├── lib/      # Utilitários e configurações
│   │   └── scripts/  # Scripts de banco de dados
│   └── prisma/       # Schema e migrações do banco
└── frontend/         # Interface do usuário
    ├── src/
    │   ├── pages/    # Páginas da aplicação
    │   ├── components/ # Componentes reutilizáveis
    │   ├── services/ # Comunicação com API
    │   └── contexts/ # Gerenciamento de estado
    └── public/       # Recursos estáticos
```

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/matalvesdev/JusCRM.git
cd JusCRM
```

### 2. Configure o Backend

```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações do banco
npx prisma migrate dev

# Inicie o servidor
npm run dev
```

### 3. Configure o Frontend

```bash
cd frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env se necessário

# Inicie a aplicação
npm run dev
```

### 4. Acesse o Sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3333

## 👤 Usuário Padrão

Após executar as migrações, você pode usar:

- **Login:** Administrador (admin@juscrm.com / admin123), Advogado (joao@juscrm.com / lawyer123), Assistente (maria@juscrm.com / assistant123)

## 🎨 Interface do Sistema

O sistema possui uma interface moderna e responsiva com:

- **Login/Registro** com design profissional
- **Dashboard** com métricas importantes
- **Sidebar** para navegação intuitiva
- **Tabelas** organizadas para listagem de dados
- **Formulários** validados para entrada de dados

## 🔒 Segurança

- Autenticação JWT
- Validação de dados em todas as camadas
- Controle de permissões por usuário
- Senhas criptografadas
- Proteção contra ataques comuns

## 📊 Módulos do Sistema

1. **Dashboard** - Visão geral e métricas
2. **Clientes** - Gestão de pessoas físicas e jurídicas
3. **Casos** - Controle de processos jurídicos
4. **Documentos** - Upload e organização de arquivos
5. **Agenda** - Calendário de compromissos
6. **Pagamentos** - Controle financeiro
7. **Atividades** - Registro de tarefas e follow-ups
8. **Configurações** - Gerenciamento de usuários e sistema

## 🛠️ Tecnologias Utilizadas

### Backend

- Node.js & TypeScript
- Fastify (Framework web)
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt para hash de senhas

### Frontend

- React 19 & TypeScript
- Vite (Build tool)
- Tailwind CSS
- shadcn/ui
- React Router v7
- React Hook Form
- Zod (Validação)
- Tanstack Query
- Axios

## 📈 Status do Desenvolvimento

- ✅ Estrutura base do backend
- ✅ Sistema de autenticação
- ✅ Modelos de dados completos
- ✅ APIs principais implementadas
- ✅ Interface de login/registro
- ✅ Dashboard básico
- ✅ Páginas de clientes e casos
- 🚧 CRUD completo (em desenvolvimento)
- 🚧 Upload de documentos (em desenvolvimento)
- 🚧 Sistema de agenda (em desenvolvimento)

## 🤝 Contribuição

Este é um projeto proprietário desenvolvido para escritórios de advocacia. Para sugestões ou melhorias, entre em contato.

## 📄 Licença

Este projeto é proprietário e todos os direitos são reservados.

---

**Desenvolvido com ❤️ para modernizar a gestão de escritórios de advocacia**
