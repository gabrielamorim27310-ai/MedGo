# MedGo

Sistema completo para gerenciamento hospitalar conectando pacientes, hospitais e planos de saúde.

## Estrutura do Projeto

Este é um monorepo gerenciado com **pnpm workspaces** e **Turbo**.

### Apps

- **web-dashboard**: Dashboard web administrativo (Next.js 14 + TypeScript) ✅
- **api-gateway**: Gateway de API REST com autenticação JWT ✅
- **queue-service**: Serviço de gerenciamento de filas com WebSocket ✅
- **notification-service**: Serviço de notificações multi-canal ✅
- **analytics-service**: Serviço de métricas e análises ✅
- **mobile**: Aplicativo móvel (a ser implementado)
- **integration-service**: Serviço de integrações (a ser implementado)

### Packages

- **shared-types**: Tipos TypeScript compartilhados entre todos os serviços
- **utils**: Utilitários compartilhados (a ser implementado)

## Tecnologias

### Frontend (Web Dashboard)
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

### Backend
- **Node.js + Express** - Runtime e framework
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM type-safe
- **JWT** - Autenticação e autorização
- **Redis** - Cache e pub/sub
- **Socket.IO** - WebSocket para atualizações em tempo real
- **Bcrypt** - Hash de senhas
- **Zod** - Validação de schemas

## Pré-requisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 6.0 (opcional, mas recomendado para cache)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/medgo.git
cd medgo
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:

**API Gateway:**
```bash
cd apps/api-gateway
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

**Queue Service:**
```bash
cd apps/queue-service
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

**Web Dashboard:**
```bash
cd apps/web-dashboard
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o banco de dados:
```bash
cd apps/api-gateway
pnpm prisma generate
pnpm prisma migrate dev --name init
```

## Executando o Projeto

### Desenvolvimento

**1. Inicie o PostgreSQL e Redis** (se ainda não estiverem rodando)

**2. Execute todos os projetos em modo desenvolvimento:**
```bash
pnpm dev
```

**Ou execute os serviços individualmente:**

API Gateway (porta 3001):
```bash
cd apps/api-gateway
pnpm dev
```

Queue Service (porta 3002):
```bash
cd apps/queue-service
pnpm dev
```

Web Dashboard (porta 3000):
```bash
cd apps/web-dashboard
pnpm dev
```

**3. Acesse a aplicação:**
- Dashboard: http://localhost:3000
- API Gateway: http://localhost:3001
- Queue Service: http://localhost:3002

### Build

Faça build de todos os projetos:
```bash
pnpm build
```

### Testes

Execute os testes:
```bash
pnpm test
```

### Lint

Execute o linter:
```bash
pnpm lint
```

## Estrutura de Pastas

```
medgo/
├── apps/
│   ├── web-dashboard/          # Dashboard administrativo
│   │   ├── src/
│   │   │   ├── app/            # App Router do Next.js
│   │   │   ├── components/     # Componentes React
│   │   │   ├── contexts/       # Contextos React
│   │   │   └── lib/            # Utilitários e configurações
│   │   └── package.json
│   ├── mobile/                 # App móvel (a implementar)
│   ├── api-gateway/            # Gateway de API (a implementar)
│   └── ...
├── packages/
│   ├── shared-types/           # Tipos TypeScript compartilhados
│   │   └── src/
│   │       ├── user.ts
│   │       ├── patient.ts
│   │       ├── hospital.ts
│   │       ├── queue.ts
│   │       └── ...
│   └── utils/                  # Utilitários (a implementar)
├── docs/                       # Documentação
├── infrastructure/             # Configurações de infraestrutura
├── scripts/                    # Scripts auxiliares
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Funcionalidades Implementadas

### Web Dashboard

- ✅ Sistema de autenticação com login
- ✅ Layout responsivo com sidebar e header
- ✅ Dashboard principal com métricas
- ✅ Gerenciamento de filas de atendimento
- ✅ Gerenciamento de pacientes
- ✅ Gerenciamento de hospitais
- ✅ Componentes UI reutilizáveis (Button, Card, Input, Table, Badge, Label)
- ✅ Busca e filtros em listas
- ✅ Visualização de estatísticas em tempo real

### API Gateway

- ✅ Autenticação JWT com login e registro
- ✅ Refresh tokens
- ✅ Middleware de autenticação e autorização
- ✅ Validação de dados com Zod
- ✅ CRUD completo de usuários
- ✅ CRUD completo de pacientes
- ✅ CRUD completo de hospitais
- ✅ CRUD completo de filas
- ✅ Tratamento de erros centralizado
- ✅ Proteção de rotas por role (RBAC)
- ✅ Endpoints RESTful bem estruturados

### Queue Service

- ✅ Gerenciamento inteligente de filas
- ✅ Cálculo automático de posição na fila
- ✅ Estimativa de tempo de espera
- ✅ Sistema de prioridades (Emergência, Urgente, Semi-urgente, Normal, Baixa)
- ✅ Atualização em tempo real via WebSocket
- ✅ Cache com Redis para otimização
- ✅ Recálculo automático de posições
- ✅ Chamar próximo paciente
- ✅ Estatísticas de filas por hospital
- ✅ Notificações em tempo real para pacientes

### Shared Types

- ✅ Tipos para usuários e autenticação
- ✅ Tipos para pacientes com dados médicos
- ✅ Tipos para hospitais com capacidade e especialidades
- ✅ Tipos para filas de atendimento
- ✅ Tipos para agendamentos (presencial e telemedicina)
- ✅ Tipos para planos de saúde com coberturas
- ✅ Tipos para notificações multi-canal
- ✅ DTOs para criação e atualização

### Banco de Dados (Prisma)

- ✅ Schema completo com todas as entidades
- ✅ Relações entre tabelas
- ✅ Índices para otimização
- ✅ Enums para tipos padronizados
- ✅ Suporte a campos JSON
- ✅ Cascade delete configurado

## Próximos Passos

1. **Integração Frontend-Backend**
   - Conectar Dashboard com API real
   - Implementar Socket.IO no frontend para updates em tempo real
   - Adicionar tratamento de erros e loading states

2. **Notification Service**
   - Sistema de notificações multi-canal (Email, SMS, Push, In-App)
   - Agendamento de notificações
   - Templates de mensagens
   - Integração com serviços de terceiros (SendGrid, Twilio)

3. **Analytics Service**
   - Métricas de desempenho hospitalar
   - Relatórios de atendimento
   - Dashboard de analytics
   - Exportação de dados

4. **Funcionalidades Adicionais**
   - Sistema de agendamentos completo
   - Gestão de planos de saúde
   - Telemedicina com vídeo chamada
   - Prontuário eletrônico
   - Prescrições digitais
   - Resultados de exames

5. **Mobile App**
   - Aplicativo React Native para pacientes
   - Check-in digital
   - Acompanhamento de fila em tempo real
   - Agendamentos
   - Telemedicina

6. **DevOps & Infraestrutura**
   - Docker e Docker Compose
   - CI/CD com GitHub Actions
   - Deploy em cloud (AWS/GCP/Azure)
   - Monitoramento e logs
   - Backup automatizado

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autores

MedGo Team

## Suporte

Para suporte, envie um email para suporte@medgo.com ou abra uma issue no GitHub.
