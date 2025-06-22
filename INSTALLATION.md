# 🚀 Guia de Instalação - JusCRM

Este guia contém instruções passo a passo para configurar e executar o JusCRM em sua máquina.

## ⚡ Início Rápido

### 1. Clone o Projeto

```bash
git clone https://github.com/matalvesdev/JusCRM.git
cd JusCRM
```

### 2. Configure o Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure o banco de dados
# Certifique-se de ter PostgreSQL instalado e rodando

# Copie e configure as variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas configurações:
# - DATABASE_URL="postgresql://usuario:senha@localhost:5432/juscrm"
# - JWT_SECRET="seu-jwt-secret-aqui"
# - PORT=3001

# Execute as migrações do banco
npx prisma migrate dev

# (Opcional) Execute o seed para dados de teste
npx prisma db seed

# Inicie o servidor
npm run dev
```

### 3. Configure o Frontend

```bash
# Em um novo terminal
cd frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente (opcional)
# O frontend já está configurado para usar http://localhost:3001

# Inicie a aplicação
npm run dev
```

### 4. Acesse o Sistema

- **Frontend:** http://localhost:5173
- **API Backend:** http://localhost:3333

## 📋 Pré-requisitos

- **Node.js** 18 ou superior
- **PostgreSQL** (local ou remoto)
- **npm** ou **yarn**

## 🔐 Usuário Padrão

Após executar as migrações, você pode criar um usuário administrador ou usar o seed para dados de teste.

## 🛠️ Comandos Úteis

### Backend

```bash
# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar migrações
npx prisma migrate dev

# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio
```

### Frontend

```bash
# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Adicionar componente shadcn/ui
npx shadcn@latest add [component-name]
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente - Backend (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/juscrm"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:5173"
```

### Variáveis de Ambiente - Frontend (.env)

```env
# API URL
VITE_API_URL=http://localhost:3001/api
```

## 🐛 Solução de Problemas

### Problema: Erro de conexão com banco

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no DATABASE_URL
- Execute `npx prisma migrate dev`

### Problema: Porta já em uso

- Backend: Altere a PORT no .env
- Frontend: Use `npm run dev -- --port 3000`

### Problema: Dependências não instaladas

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Próximos Passos

Após a instalação:

1. Explore a interface de login/registro
2. Acesse o dashboard
3. Teste os módulos de clientes e casos
4. Configure usuários adicionais
5. Personalize conforme suas necessidades

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique os logs no terminal
2. Consulte a documentação no README.md
3. Verifique as issues no GitHub

---

**Happy Coding! 🚀**
