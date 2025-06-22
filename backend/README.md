# JusCRM Backend

API do CRM para Escritórios de Advocacia Trabalhista, construída com Fastify, TypeScript, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **Fastify** - Framework HTTP ultrarrápido
- **TypeScript** - Tipagem estática
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **Zod** - Validação de schemas
- **JWT** - Autenticação baseada em tokens
- **bcrypt** - Hash de senhas

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

4. Configure o banco de dados PostgreSQL e atualize a `DATABASE_URL` no `.env`

5. Execute as migrações do Prisma:

   ```bash
   npm run db:push
   ```

6. (Opcional) Execute o seed para popular o banco com dados de teste:
   ```bash
   npm run db:seed
   ```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm start` - Inicia o servidor em produção
- `npm run db:generate` - Gera o cliente Prisma
- `npm run db:push` - Sincroniza o schema com o banco
- `npm run db:migrate` - Executa migrações
- `npm run db:studio` - Abre o Prisma Studio
- `npm run db:seed` - Popula o banco com dados de teste

## 📡 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Usuários

- `GET /api/users/profile` - Perfil do usuário atual
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users` - Listar usuários (admin)

### Clientes

- `POST /api/clients` - Criar cliente
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obter cliente

### Casos

- `POST /api/cases` - Criar caso
- `GET /api/cases` - Listar casos
- `GET /api/cases/:id` - Obter caso

### Documentos

- `GET /api/documents` - Listar documentos

### Petições

- `GET /api/petitions` - Listar petições

### Agendamentos

- `GET /api/appointments` - Listar agendamentos

### Pagamentos

- `GET /api/payments` - Listar pagamentos

### Atividades

- `GET /api/activities` - Listar atividades

## 🔒 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header `Authorization`:

```
Authorization: Bearer seu_token_aqui
```

## 📊 Dados de Teste

Após executar o seed (`npm run db:seed`), você terá:

- **Admin**: admin@juscrm.com / admin123
- **Advogado**: joao@juscrm.com / lawyer123
- **Assistente**: maria@juscrm.com / assistant123
- **5 Clientes** com perfis diferentes
- **5 Casos** com diferentes tipos e status

## 📝 Documentação

Com o servidor rodando em desenvolvimento, acesse:

- **Swagger UI**: http://localhost:3333/docs
- **Health Check**: http://localhost:3333/health

## 🏗️ Estrutura do Projeto

```
src/
├── config/          # Configurações (env, database)
├── lib/             # Bibliotecas e utilitários
├── plugins/         # Plugins do Fastify
├── routes/          # Rotas da API
├── scripts/         # Scripts (seed, migrations)
└── server.ts        # Arquivo principal
```

## 🛡️ Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Rate limiting
- Helmet para headers de segurança
- Validação rigorosa de entrada com Zod
- CORS configurado
