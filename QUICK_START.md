# 🚀 Guia Rápido - MedGo

## Pré-requisitos

### 1. Instalar Docker Desktop (Obrigatório)
**Windows:**
- Download: https://www.docker.com/products/docker-desktop/
- Instale e reinicie o computador
- Certifique-se que o Docker Desktop está rodando

**Verificar instalação:**
```bash
docker --version
docker compose version
```

### 2. Instalar Node.js 18+ (Obrigatório)
- Download: https://nodejs.org/
- Escolha a versão LTS (Long Term Support)

**Verificar instalação:**
```bash
node --version
npm --version
```

### 3. Instalar pnpm (Obrigatório)
```bash
npm install -g pnpm
```

**Verificar instalação:**
```bash
pnpm --version
```

---

## 🎯 Inicialização Rápida (5 minutos)

### Passo 1: Iniciar Infraestrutura (PostgreSQL + Redis)
```bash
# Certifique-se que o Docker Desktop está rodando
docker compose up -d
```

**Verificar se está rodando:**
```bash
docker compose ps
```

Você deve ver:
- `medgo-postgres` - Rodando na porta 5432
- `medgo-redis` - Rodando na porta 6379
- `medgo-adminer` - Rodando na porta 8080

### Passo 2: Instalar Dependências
```bash
# Na raiz do projeto
pnpm install
```

### Passo 3: Configurar Banco de Dados
```bash
# Configurar variáveis de ambiente
cd apps/api-gateway
copy .env.example .env

# Gerar Prisma Client
pnpm prisma generate

# Executar migrations
pnpm prisma migrate dev --name init

# Voltar para raiz
cd ../..
```

### Passo 4: Configurar Outros Serviços
```bash
# Queue Service
cd apps/queue-service
copy .env.example .env
cd ../..

# Notification Service
cd apps/notification-service
copy .env.example .env
cd ../..

# Analytics Service
cd apps/analytics-service
copy .env.example .env
cd ../..

# Web Dashboard
cd apps/web-dashboard
copy .env.example .env
cd ../..
```

### Passo 5: Executar Todos os Serviços
```bash
# Na raiz do projeto
pnpm dev
```

Isso iniciará:
- **API Gateway** na porta 3001
- **Queue Service** na porta 3002
- **Notification Service** na porta 3003
- **Analytics Service** na porta 3004
- **Web Dashboard** na porta 3000

---

## 🌐 Acessar a Aplicação

### Frontend
- **Dashboard:** http://localhost:3000
- **Login:** http://localhost:3000/login

### Backend APIs
- **API Gateway:** http://localhost:3001/health
- **Queue Service:** http://localhost:3002/health
- **Notification Service:** http://localhost:3003/health
- **Analytics Service:** http://localhost:3004/health

### Ferramentas
- **Adminer (DB Admin):** http://localhost:8080
  - Sistema: PostgreSQL
  - Servidor: medgo-postgres
  - Usuário: medgo
  - Senha: medgo123
  - Base de dados: medgo

---

## 🧪 Executar Testes

```bash
cd apps/api-gateway

# Todos os testes
pnpm test

# Modo watch (durante desenvolvimento)
pnpm test:watch

# Com cobertura
pnpm test:coverage
```

---

## 🛑 Parar Serviços

### Parar aplicações Node.js
```
Ctrl + C no terminal onde executou `pnpm dev`
```

### Parar Docker
```bash
docker compose down
```

### Parar e remover volumes (limpar dados)
```bash
docker compose down -v
```

---

## 🔧 Resolver Problemas Comuns

### Docker não inicia
1. Certifique-se que o Docker Desktop está instalado e rodando
2. No Windows, verifique se a virtualização está habilitada no BIOS
3. Reinicie o Docker Desktop

### Porta já em uso
```bash
# Ver o que está usando a porta 3000
netstat -ano | findstr :3000

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID [número] /F
```

### Erro de conexão com banco de dados
```bash
# Verificar se o PostgreSQL está rodando
docker compose ps

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar PostgreSQL
docker compose restart postgres
```

### Prisma Client não gerado
```bash
cd apps/api-gateway
pnpm prisma generate
```

### Migrations não aplicadas
```bash
cd apps/api-gateway
pnpm prisma migrate deploy
```

---

## 📝 Criar Primeiro Usuário

Você pode usar a API ou Prisma Studio:

### Opção 1: Via API
```bash
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
```

### Opção 2: Via Prisma Studio
```bash
cd apps/api-gateway
pnpm prisma studio
```

Isso abrirá http://localhost:5555 onde você pode criar usuários manualmente.

---

## 🎯 Próximos Passos

1. ✅ Iniciar Docker Compose
2. ✅ Instalar dependências
3. ✅ Configurar banco de dados
4. ✅ Executar aplicação
5. ✅ Acessar http://localhost:3000
6. 📚 Explorar a aplicação
7. 🧪 Executar testes
8. 💻 Começar a desenvolver!

---

## 📚 Documentação Adicional

- [README.md](README.md) - Documentação principal
- [SETUP.md](docs/SETUP.md) - Guia detalhado de setup
- [API.md](docs/API.md) - Documentação da API
- [PROGRESS.md](PROGRESS.md) - Progresso do projeto
- [STATUS.md](STATUS.md) - Status atual

---

## 🆘 Ajuda

Se encontrar problemas:
1. Verifique os logs: `docker compose logs`
2. Verifique o [SETUP.md](docs/SETUP.md)
3. Abra uma issue no GitHub

---

**Boa sorte e bom desenvolvimento! 🚀**
