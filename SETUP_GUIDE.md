# Guia de Configuração - MedGo

Este guia irá ajudá-lo a configurar e executar o protótipo do MedGo.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (v18 ou superior)
   - Download: https://nodejs.org/
   - Verificar: `node --version`

2. **pnpm** (v8 ou superior)
   - Instalar: `npm install -g pnpm`
   - Verificar: `pnpm --version`

3. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop/
   - Verificar: `docker --version`

## Instalação Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Iniciar Docker (PostgreSQL e Redis)

```bash
pnpm docker:up
```

### 3. Configurar Banco de Dados

```bash
pnpm db:migrate
```

### 4. Build dos Pacotes Compartilhados

```bash
pnpm build --filter @medgo/shared-types
```

## Executando o Protótipo

### Opção 1: Rodar Todos os Serviços

```bash
pnpm dev
```

### Opção 2: Rodar Serviços Individualmente

**API Gateway:**
```bash
pnpm dev:api
```

**Web Dashboard:**
```bash
pnpm dev:web
```

**Analytics Service:**
```bash
pnpm dev:analytics
```

## URLs dos Serviços

- **API Gateway**: http://localhost:3001
- **Web Dashboard**: http://localhost:3000
- **Analytics Service**: http://localhost:3004
- **Adminer (Gerenciador de DB)**: http://localhost:8080
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuário: medgo
  - Senha: medgo123
  - Database: medgo

## Comandos Úteis

### Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes do API Gateway
pnpm test:api
```

### Banco de Dados

```bash
# Abrir Prisma Studio (interface visual)
pnpm db:studio

# Criar nova migration
pnpm --filter api-gateway prisma migrate dev --name <nome>

# Gerar Prisma Client
pnpm --filter api-gateway prisma generate
```

### Docker

```bash
# Ver logs dos containers
pnpm docker:logs

# Parar containers
pnpm docker:down

# Reiniciar containers
pnpm docker:down && pnpm docker:up
```

### Limpeza

```bash
# Limpar node_modules e caches
pnpm clean

# Reinstalar tudo
pnpm clean && pnpm install
```

## Estrutura do Projeto

```
medgo/
├── apps/
│   ├── api-gateway/         # Backend principal (Express + Prisma)
│   ├── analytics-service/   # Serviço de analytics e relatórios
│   ├── queue-service/       # Gerenciamento de filas
│   ├── notification-service/# Notificações (Email, SMS, Push)
│   └── web-dashboard/       # Frontend (Next.js 14)
├── packages/
│   └── shared-types/        # Tipos TypeScript compartilhados
├── docker-compose.yml       # Configuração Docker
└── package.json             # Scripts do projeto
```

## Tecnologias Utilizadas

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Recharts (visualizações)
- Axios

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Socket.IO (tempo real)
- Bull (filas)

### DevOps
- Docker & Docker Compose
- pnpm Workspaces
- Turbo (monorepo)
- Jest (testes)

## Problemas Comuns

### Docker não inicia

**Erro**: `Docker not found` ou `Cannot connect to Docker daemon`

**Solução**: 
1. Certifique-se de que o Docker Desktop está instalado e rodando
2. No Windows, verifique se o Docker Desktop está em execução

### Porta já em uso

**Erro**: `Port 3001 is already in use`

**Solução**: 
1. Pare o processo que está usando a porta
2. Ou altere a porta no arquivo `.env` do serviço

### Prisma não gera o cliente

**Erro**: `@prisma/client did not initialize yet`

**Solução**:
```bash
pnpm --filter api-gateway prisma generate
```

### Testes falhando

**Erro**: Testes unitários falhando

**Solução**:
1. Certifique-se de que o shared-types foi buildado: `pnpm build --filter @medgo/shared-types`
2. Rode os testes novamente: `pnpm test:api`

## Próximos Passos

Após configurar o ambiente:

1. ✅ Testes estão passando (25/25)
2. ✅ Docker containers rodando
3. ✅ Banco de dados migrado
4. 🔄 Serviços backend iniciados
5. 🔄 Frontend rodando

## Suporte

Para problemas ou dúvidas, consulte:
- [Documentação do Projeto](./README.md)
- [Status do Projeto](./STATUS.md)
- [Changelog](./CHANGELOG.md)
