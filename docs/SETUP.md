# Guia de Configuração - MedGo

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Executando o Projeto](#executando-o-projeto)
6. [Problemas Comuns](#problemas-comuns)

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
  - Download: https://nodejs.org/
  - Verificar: `node --version`

- **pnpm** (versão 8 ou superior)
  - Instalar: `npm install -g pnpm`
  - Verificar: `pnpm --version`

- **PostgreSQL** (versão 14 ou superior)
  - Download: https://www.postgresql.org/download/
  - Ou use Docker (recomendado - veja abaixo)

- **Redis** (versão 6 ou superior) - Opcional
  - Download: https://redis.io/download/
  - Ou use Docker (recomendado - veja abaixo)

- **Docker e Docker Compose** (opcional, mas recomendado)
  - Download: https://www.docker.com/

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/medgo.git
cd medgo
```

### 2. Instale as Dependências

```bash
pnpm install
```

Isso instalará todas as dependências de todos os workspaces (apps e packages).

## Configuração do Banco de Dados

### Opção 1: Usando Docker (Recomendado)

O projeto inclui um arquivo `docker-compose.yml` que configura PostgreSQL, Redis e Adminer.

```bash
# Iniciar os serviços
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Parar os serviços
docker-compose down

# Parar e remover volumes (limpar dados)
docker-compose down -v
```

Serviços disponíveis:
- PostgreSQL: `localhost:5432`
  - Usuário: `medgo`
  - Senha: `medgo123`
  - Database: `medgo`
- Redis: `localhost:6379`
- Adminer (interface web para PostgreSQL): `http://localhost:8080`

### Opção 2: Instalação Local

Se preferir não usar Docker:

1. **PostgreSQL:**
   - Instale PostgreSQL
   - Crie um banco de dados: `CREATE DATABASE medgo;`
   - Crie um usuário (opcional)

2. **Redis:**
   - Instale Redis
   - Inicie o serviço: `redis-server`

## Variáveis de Ambiente

### API Gateway

```bash
cd apps/api-gateway
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://medgo:medgo123@localhost:5432/medgo?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**IMPORTANTE:** Altere os secrets JWT em produção!

### Queue Service

```bash
cd apps/queue-service
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL="postgresql://medgo:medgo123@localhost:5432/medgo?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Web Dashboard

```bash
cd apps/web-dashboard
cp .env.example .env
```

Edite o arquivo `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Configurando o Prisma

### 1. Gerar Cliente Prisma

```bash
cd apps/api-gateway
pnpm prisma generate
```

### 2. Executar Migrations

```bash
pnpm prisma migrate dev --name init
```

Isso criará todas as tabelas no banco de dados.

### 3. (Opcional) Seed do Banco

Se você tiver dados iniciais, pode criar um seed:

```bash
pnpm prisma db seed
```

### 4. Verificar Banco de Dados

Você pode usar o Prisma Studio para visualizar os dados:

```bash
pnpm prisma studio
```

Ou use o Adminer: http://localhost:8080

## Executando o Projeto

### Todos os Serviços (Recomendado)

Na raiz do projeto:

```bash
pnpm dev
```

Isso iniciará todos os serviços usando Turbo:
- API Gateway (porta 3001)
- Queue Service (porta 3002)
- Web Dashboard (porta 3000)

### Serviços Individuais

**API Gateway:**
```bash
cd apps/api-gateway
pnpm dev
```

**Queue Service:**
```bash
cd apps/queue-service
pnpm dev
```

**Web Dashboard:**
```bash
cd apps/web-dashboard
pnpm dev
```

## Acessando a Aplicação

Após iniciar os serviços:

- **Dashboard:** http://localhost:3000
- **API Gateway:** http://localhost:3001
- **Queue Service:** http://localhost:3002
- **Adminer (DB):** http://localhost:8080

## Testando a API

### Usando curl

```bash
# Health Check
curl http://localhost:3001/health

# Registrar Usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medgo.com",
    "password": "admin123",
    "name": "Administrador",
    "cpf": "12345678901",
    "phone": "11987654321",
    "role": "SYSTEM_ADMIN"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medgo.com",
    "password": "admin123"
  }'
```

### Usando Postman/Insomnia

Importe a coleção de APIs (se disponível) ou crie requests manualmente seguindo a documentação em `docs/API.md`.

## Problemas Comuns

### Porta já em uso

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solução:** Mude a porta no arquivo `.env` ou encerre o processo que está usando a porta.

### Erro de conexão com PostgreSQL

```
Error: P1001: Can't reach database server
```

**Soluções:**
1. Verifique se o PostgreSQL está rodando
2. Verifique a `DATABASE_URL` no `.env`
3. Se usando Docker: `docker-compose ps`

### Erro de conexão com Redis

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Soluções:**
1. Redis é opcional. O sistema funcionará sem ele, mas sem cache
2. Inicie o Redis: `docker-compose up -d redis` ou `redis-server`

### Prisma Client não gerado

```
Error: Cannot find module '@prisma/client'
```

**Solução:**
```bash
cd apps/api-gateway
pnpm prisma generate
```

### Erro ao executar migrations

```
Error: Migration engine error
```

**Soluções:**
1. Verifique se o banco de dados existe
2. Verifique a `DATABASE_URL`
3. Apague a pasta `prisma/migrations` e execute `prisma migrate dev` novamente

### PNPM não encontrado

```
pnpm: command not found
```

**Solução:**
```bash
npm install -g pnpm
```

## Build para Produção

### Build de todos os projetos

```bash
pnpm build
```

### Build individual

```bash
cd apps/api-gateway
pnpm build
pnpm start
```

## Scripts Úteis

```bash
# Limpar node_modules e builds
pnpm clean

# Formatar código
pnpm format

# Lint
pnpm lint

# Ver logs do Docker
docker-compose logs -f

# Resetar banco de dados
cd apps/api-gateway
pnpm prisma migrate reset
```

## Próximos Passos

1. Leia a [documentação da API](./API.md)
2. Explore o código-fonte
3. Contribua com o projeto!

## Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação completa
- Entre em contato com a equipe
