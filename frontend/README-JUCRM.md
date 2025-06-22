# JusCRM - Frontend

Sistema de Gestão para Escritórios de Advocacia - Interface do Usuário

## 🚀 Tecnologias Utilizadas

- **React 19** com TypeScript
- **Vite** para desenvolvimento e build
- **Tailwind CSS** para estilização
- **shadcn/ui** como biblioteca de componentes
- **React Router v7** para navegação
- **React Hook Form** + **Zod** para formulários e validação
- **Tanstack React Query** para gerenciamento de estado
- **Axios** para requisições HTTP

## 📁 Estrutura do Projeto

```
src/
├── assets/           # Imagens e recursos estáticos
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes do shadcn/ui
│   ├── AppSidebar.tsx
│   ├── MainLayout.tsx
│   └── TopBar.tsx
├── contexts/         # Contextos React (Auth, etc.)
├── hooks/           # Hooks customizados
├── lib/             # Utilitários e configurações
├── pages/           # Páginas da aplicação
├── services/        # Serviços de API
└── types/           # Definições de tipos TypeScript
```

## 🔐 Autenticação

O sistema possui duas páginas de autenticação com design moderno:

- **Login** (`/login`) - Com imagem da balança da justiça
- **Registro** (`/register`) - Com imagem da estátua da justiça

Ambas as páginas utilizam:

- Layout responsivo de duas colunas
- Validação de formulários com Zod
- Feedback visual de erros
- Integração com contexto de autenticação

## 📱 Principais Páginas

### Dashboard

- Visão geral do escritório
- Cards de estatísticas
- Atividades recentes
- Próximos compromissos

### Clientes

- Lista de clientes
- Filtros e busca
- Interface para CRUD completo

### Casos

- Gestão de casos jurídicos
- Estatísticas por status
- Filtros avançados

## 🎨 Design System

O projeto utiliza shadcn/ui com personalização:

- Paleta de cores profissional
- Tipografia consistente
- Componentes acessíveis
- Dark mode suportado

## 🛠 Como Executar

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**

   ```bash
   # .env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Executar em modo desenvolvimento:**

   ```bash
   npm run dev
   ```

4. **Build para produção:**
   ```bash
   npm run build
   ```

## 🔗 Integração com Backend

O frontend está configurado para se comunicar com a API através do `ApiService`:

- **Base URL:** `http://localhost:3001/api`
- **Autenticação:** JWT tokens
- **Interceptors** para automatização de headers
- **Tratamento de erros** centralizado

## 📋 Funcionalidades Implementadas

- ✅ Sistema de autenticação completo
- ✅ Layout responsivo com sidebar
- ✅ Páginas de login e registro
- ✅ Dashboard com estatísticas
- ✅ Páginas de clientes e casos
- ✅ Roteamento protegido
- ✅ Integração com API
- ✅ Validação de formulários
- ✅ Design system consistente

## 🚧 Próximos Passos

- [ ] Implementar CRUD completo para clientes
- [ ] Adicionar formulários de criação/edição
- [ ] Sistema de upload de documentos
- [ ] Calendário para agendamentos
- [ ] Dashboard com dados reais
- [ ] Notificações toast
- [ ] Paginação e filtros avançados
- [ ] Relatórios e exportação

## 🧑‍💻 Desenvolvimento

Para adicionar novos componentes shadcn/ui:

```bash
npx shadcn@latest add [component-name]
```

Para adicionar novas páginas, seguir o padrão em `src/pages/` e atualizar as rotas em `App.tsx`.

## 📝 Licença

Este projeto é proprietário e destinado ao uso interno do escritório de advocacia.
