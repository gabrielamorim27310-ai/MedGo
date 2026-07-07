# Acolhe

> **Sua vez chega até você.**

Plataforma B2B white-label de **fila virtual hospitalar**: o paciente faz o check-in pelo app, recebe uma senha digital, acompanha a posição e o tempo de espera em tempo real — e o hospital reduz custos de recepção, papel e impressão.

Anteriormente conhecida como *MedGo*, a plataforma foi renomeada e redesenhada com identidade visual **glassmorphism**: painéis de vidro fosco flutuando sobre um gradiente nas cores da marca — leveza e transparência, como a espera que a plataforma elimina.

## O que a plataforma entrega (alinhado ao pitch)

| Diferencial do pitch | Onde está implementado |
| --- | --- |
| Fila virtual orientada por app | `queue-service` (posição, senha `N-042`, WebSocket) orquestrado pelo `api-gateway` |
| Estimativa dinâmica de espera | `WaitTimeEstimator` (EWMA por recência + guichês ativos + fator de demanda por hora) |
| Recomendação de unidades por geolocalização | `GET /api/hospitals/nearby` (Haversine + situação da fila + convênio, com links Maps/Waze) |
| Integração automática com operadoras | Verificação de elegibilidade no check-in (`EligibilityService`) + OAuth de operadoras |
| Prontuário eletrônico integrado (padrão TISS) | CID-10, procedimentos TUSS e guia TISS por atendimento (`GET /api/appointments/:id/tiss`) |
| Segurança de dados e conformidade com a LGPD | Consentimento no cadastro, trilha de auditoria (`AuditLog`), exportação de dados (`GET /api/auth/me/export`) |
| White label para hospitais e planos | `BrandingConfig` por tenant (`GET /api/branding/:slug`) |
| Redução de papel e time administrativo | Senha digital, notificações automáticas (fila e agendamentos), guia TISS digital |

## Arquitetura

Monorepo **pnpm workspaces + Turbo**:

```
apps/
  web-dashboard          Next.js 14 — painel skeumórfico (pacientes, hospitais, operadoras)
  api-gateway            :3001 — REST + JWT; orquestra elegibilidade, geolocalização, TISS, LGPD, branding
  queue-service          :3002 — fila virtual: posição, senha, estimativa dinâmica, Socket.IO, Redis
  notification-service   :3003 — notificações multi-canal com fila Bull (Redis)
  analytics-service      :3004 — métricas e relatórios
packages/
  shared-types           Tipos TypeScript compartilhados (@acolhe/shared-types)
```

### Fluxo integrado do check-in

1. Paciente faz check-in (`POST /api/queues` no gateway).
2. Gateway valida hospital ativo e **elegibilidade junto à operadora** (convênio + cobertura do plano + coparticipação).
3. Gateway delega ao **queue-service**, que calcula posição, gera a **senha** (`N-042`), estima a espera dinamicamente e emite eventos WebSocket para o painel do hospital e para o paciente.
4. O queue-service despacha a notificação de check-in ao **notification-service** (e avisa quando faltar pouco e quando o paciente for chamado).
5. Na conclusão do atendimento, o médico registra CID-10/procedimentos e a **guia TISS** é emitida automaticamente.

## Identidade visual

- **Nome**: Acolhe — de *acolhimento*, o nome oficial da recepção com classificação de risco nos hospitais brasileiros.
- **Símbolo**: a senha de guichê como cartão de vidro, com picotes laterais e a cruz de acolhimento em gradiente acqua.
- **Estilo**: glassmorphism — painéis translúcidos com `backdrop-blur`, bordas claras de 1px, brilho interno e gradiente mesh de fundo; a transparência como metáfora do produto (fila visível em tempo real).
- **Paleta**: verde-acqua `#16736B → #2EC4B0` · âmbar `#F59E0B` · gelo `#EFF7F6` · tinta `#182B30`.
- **Tipografia**: Sora (títulos) + Inter (texto).
- Utilities do design system em `globals.css`: `.glass`, `.glass-strong`, `.glass-subtle`, `.tint-teal`, `.tint-amber`, `.tint-red`, `.glass-sheen`, `.glow-ring`.

## Pré-requisitos

- Node.js >= 18
- pnpm >= 8
- Docker (PostgreSQL + Redis) — ou instâncias locais

## Como rodar

```bash
# 1. Dependências
pnpm install

# 2. Infra (PostgreSQL na porta 5433, Redis na 6379, Adminer na 8080)
docker-compose up -d

# 3. Variáveis de ambiente (cada app tem um .env.example alinhado)
for app in api-gateway queue-service notification-service analytics-service; do
  cp apps/$app/.env.example apps/$app/.env
done
cp apps/web-dashboard/.env.local.example apps/web-dashboard/.env.local

# 4. Banco
pnpm --filter api-gateway exec prisma migrate dev

# 5. Tudo de uma vez
pnpm dev
```

Serviços: dashboard em `http://localhost:3000`, gateway em `:3001`, fila em `:3002`, notificações em `:3003`, analytics em `:3004`.

## Endpoints novos (reformulação)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/hospitals/nearby?latitude&longitude&radiusKm&specialty&healthInsuranceId` | Unidades próximas ranqueadas por distância + fila |
| `POST` | `/api/queues` | Check-in com verificação de elegibilidade e senha digital |
| `POST` | `/api/queues/call-next` | Chama o próximo paciente (painel da recepção) |
| `GET` | `/api/queues/hospital/:id/stats` | Estatísticas em tempo real (estimador dinâmico) |
| `GET` | `/api/appointments/:id/tiss` | Guia TISS do atendimento concluído |
| `GET` | `/api/branding/:slug` | Tema white-label do tenant (público) |
| `PUT` | `/api/branding` | Cria/atualiza tema do tenant (admin) |
| `GET` | `/api/auth/me/export` | LGPD: exportação dos dados do titular |
| `POST` | `/api/auth/me/consent` | LGPD: registro de consentimento |
| `POST` | `/api/auth/google` | SSO Google (troca o ID token do GIS pelo JWT da plataforma) |
| `POST` | `/api/auth/verify-email` | Confirma o e-mail a partir do link enviado via Resend |
| `POST` | `/api/auth/verify-email/resend` | Reenvia o link de verificação |

## Autenticação

- **SSO Google**: botão "Continuar com Google" no login (Google Identity Services). Configure `GOOGLE_CLIENT_ID` no api-gateway e `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no web-dashboard com o mesmo client ID do [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (tipo "Web application", origem `http://localhost:3000`). Contas Google entram com e-mail já verificado.
- **Verificação de e-mail (Resend)**: com `RESEND_API_KEY` configurada, todo cadastro por senha recebe um link de confirmação por e-mail e o login fica bloqueado até a verificação. Sem a chave (dev), o link é logado no console do gateway e as contas nascem verificadas. O reset de senha também é enviado pela Resend.

## Modelo de negócio

B2B white-label para hospitais e operadoras: cada contratante recebe seu próprio tema (logo, cores, nome) sobre a mesma plataforma, via `BrandingConfig`.

## Licença

MIT
