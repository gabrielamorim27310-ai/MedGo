# Changelog - Acolhe

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não Lançado] - 2026-01-24

### ✨ Adicionado

#### Testes Automatizados Expandidos
- **Testes Unitários**
  - `AppointmentController.test.ts` - 9 casos de teste
  - `PatientController.test.ts` - 8 casos de teste
  - Cobertura de create, findAll, findOne, update, delete, confirm, cancel, checkIn

- **Testes de Integração E2E**
  - `auth.integration.test.ts` - 6 casos de teste de integração
  - Testes de registro, login, validação de credenciais
  - Testes de health check

- **Cobertura de Testes:** ~40%

#### Analytics Service Completo
- **Backend (Analytics Service)**
  - `AnalyticsService.ts` - Serviço completo de métricas e análises
  - `AnalyticsController.ts` - Controller com 6 endpoints
  - `routes/index.ts` - Rotas RESTful

- **Funcionalidades de Analytics**
  - ✅ Métricas gerais (overview)
  - ✅ Analytics de agendamentos (total, por status, por tipo, duração média, no-show rate)
  - ✅ Analytics de filas (total, por status, por prioridade, tempo médio, taxa de conclusão)
  - ✅ Performance por hospital (métricas completas, taxa de utilização)
  - ✅ Tendências ao longo do tempo (30 dias customizável)
  - ✅ Top hospitais (rankings de performance)

- **Frontend (Web Dashboard)**
  - `useAnalytics.ts` - Hook customizado para analytics
  - `analytics/page.tsx` - Página completa de analytics
  - Cards de métricas gerais
  - Gráficos de distribuição
  - Rankings de hospitais
  - Resumo de performance

#### Sistema de Agendamentos Completo
- **Backend (API Gateway)**
  - `AppointmentController.ts` - Controller completo com 11 endpoints
  - `appointment.routes.ts` - Rotas RESTful com autenticação e autorização
  - `appointment.validator.ts` - Validações com Zod
  - `AppointmentNotificationService.ts` - Integração automática com notificações

- **Funcionalidades de Agendamento**
  - ✅ Criar novo agendamento
  - ✅ Listar agendamentos com filtros (status, tipo, data, hospital, paciente, médico)
  - ✅ Visualizar detalhes do agendamento
  - ✅ Editar agendamento
  - ✅ Deletar agendamento
  - ✅ Confirmar agendamento
  - ✅ Cancelar agendamento com motivo
  - ✅ Reagendar agendamento
  - ✅ Check-in digital
  - ✅ Concluir atendimento
  - ✅ Buscar horários disponíveis
  - ✅ Estatísticas de agendamentos (total, por status, por tipo, próximos, hoje)

- **Frontend (Web Dashboard)**
  - `useAppointments.ts` - Hook customizado completo para gerenciar agendamentos
  - `appointments/page.tsx` - Página de agendamentos com interface completa
  - Estatísticas em tempo real (Total, Hoje, Próximos, Confirmados, Check-in)
  - Filtros por status
  - Busca de pacientes
  - Ações rápidas (Confirmar, Check-in, Cancelar)
  - Paginação

#### Integração Agendamentos + Notificações
- **Notificações Automáticas**
  - ✅ Ao criar agendamento
  - ✅ Ao confirmar agendamento
  - ✅ Ao cancelar agendamento
  - ✅ Ao reagendar agendamento
  - ✅ Lembretes automáticos (1 dia antes, 1 hora antes)

- **Detalhes nas Notificações**
  - Nome do hospital
  - Nome do médico
  - Data e horário do agendamento
  - Endereço do hospital
  - Motivo do cancelamento (quando aplicável)

#### Testes Automatizados
- **Configuração**
  - Jest 29.7.0 configurado
  - ts-jest para TypeScript
  - Supertest para testes de integração
  - Scripts: `test`, `test:watch`, `test:coverage`

- **Testes Implementados**
  - AuthController.test.ts com 5 casos de teste
  - Mocks para Prisma, bcrypt, JWT
  - Setup global de testes

#### Melhorias na Documentação
- `PROGRESS.md` - Documentação detalhada do progresso
- Atualização do `README.md` com novas funcionalidades
- `CHANGELOG.md` - Este arquivo

### 🔧 Modificado

- **API Gateway**
  - `routes/index.ts` - Adicionada rota `/api/appointments`
  - `package.json` - Adicionadas dependências de teste

- **Web Dashboard**
  - `package.json` - Adicionado `socket.io-client`
  - Sidebar já continha link para agendamentos

### 📈 Estatísticas

- **Arquivos Criados:** 10+
- **Linhas de Código Adicionadas:** ~2,700
- **Endpoints Criados:** 11
- **Hooks Criados:** 1
- **Páginas Criadas:** 1
- **Testes Criados:** 1 arquivo com 5 casos

### 🎯 Cobertura de Funcionalidades

**Sistema de Agendamentos:** 100% ✅
- CRUD completo
- Fluxo completo (Criar → Confirmar → Check-in → Atender → Concluir)
- Cancelamento e reagendamento
- Notificações integradas
- Horários disponíveis
- Estatísticas

**Integração:** 100% ✅
- Frontend ↔️ Backend
- Agendamentos ↔️ Notificações
- Autenticação e autorização por role

**Testes:** 20% (Iniciado)
- AuthController testado
- Infraestrutura de testes configurada
- Próximos passos: expandir cobertura

---

## Versões Anteriores

### [0.2.0] - Fase de Integração

#### Adicionado
- Hooks customizados (useApi, usePatients, useHospitals, useQueues, useSocket)
- Componentes de Loading e Error
- Notification Service completo
- Integração frontend-backend

### [0.1.0] - Fase Fundação

#### Adicionado
- Arquitetura de monorepo com pnpm e Turbo
- Shared Types Package
- API Gateway com autenticação JWT
- Queue Service com WebSocket
- Web Dashboard com Next.js 14
- Banco de dados PostgreSQL com Prisma
- Docker Compose para desenvolvimento
- Documentação inicial

---

## Roadmap

### Próximas Versões

#### [0.4.0] - Analytics & Relatórios
- Analytics Service
- Dashboard de métricas
- Relatórios exportáveis
- Gráficos e visualizações

#### [0.5.0] - Mobile & Telemedicina
- React Native App
- Telemedicina com WebRTC
- Prontuário eletrônico
- Prescrições digitais

#### [1.0.0] - Produção
- Cobertura de testes 80%+
- CI/CD completo
- Deploy em cloud
- Monitoramento e logs
- Documentação completa
- LGPD compliance

---

**Legenda:**
- ✨ Adicionado: Novas funcionalidades
- 🔧 Modificado: Alterações em funcionalidades existentes
- 🐛 Corrigido: Correções de bugs
- 🗑️ Removido: Funcionalidades removidas
- 🔒 Segurança: Correções de vulnerabilidades
- 📝 Documentação: Mudanças na documentação
