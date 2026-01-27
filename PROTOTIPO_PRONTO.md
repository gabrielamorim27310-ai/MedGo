# Protótipo MedGo - PRONTO PARA USO

## Testes - 100% Passando

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total

- AppointmentController: 9/9 testes passando
- PatientController: 8/8 testes passando  
- AuthController: 5/5 testes passando

## Como Executar

### Passo 1: Instalar Dependências
pnpm install

### Passo 2: Subir Docker (PostgreSQL + Redis)
pnpm docker:up

### Passo 3: Executar Migrations
pnpm db:migrate

### Passo 4: Iniciar Serviços

Terminal 1 - API Gateway:
pnpm dev:api

Terminal 2 - Web Dashboard:
pnpm dev:web

Terminal 3 - Analytics Service:
pnpm dev:analytics

## URLs dos Serviços

- API Gateway: http://localhost:3001
- Web Dashboard: http://localhost:3000
- Analytics Service: http://localhost:3004
- Adminer (DB): http://localhost:8080
  - User: medgo
  - Password: medgo123
  - Database: medgo

## Status

- Docker: Configurado
- Testes: 100% passando
- Arquivos .env: Criados
- Migrations: Prontas
- Scripts: Configurados
- Documentação: Completa

