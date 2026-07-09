# Deploy da Acolhe (stack gratuita e permanente)

Arquitetura publicada:

```
Vercel (frontend Next.js)  →  Render (api-gateway + queue-service)
                                  ├─ Neon     (PostgreSQL)
                                  └─ Upstash  (Redis)
```

Tudo em planos gratuitos permanentes. O único incômodo do plano free do
Render: os serviços "dormem" após ~15 min sem acesso e o primeiro request
seguinte demora ~50s para acordar.

---

## 1. Banco de dados — Neon (PostgreSQL)

1. Crie conta em https://neon.tech (pode entrar com o Google).
2. **Create project** → nome `acolhe`, região mais próxima (ex.: AWS São Paulo).
3. Copie a **connection string** (botão *Connect* → *Connection string*).
   Fica no formato:
   ```
   postgresql://usuario:senha@ep-xxxx.sa-east-1.aws.neon.tech/acolhe?sslmode=require
   ```
   Guarde — será a `DATABASE_URL`.

## 2. Cache — Upstash (Redis)

1. Crie conta em https://upstash.com.
2. **Create Database** → nome `acolhe`, tipo Regional, região próxima.
3. Na aba do banco, copie a URL no formato **`rediss://`** (com TLS):
   ```
   rediss://default:senha@apn1-xxxx.upstash.io:6379
   ```
   Guarde — será a `REDIS_URL`.

## 3. Backend — Render (blueprint)

1. Crie conta em https://render.com (entre com o GitHub).
2. **New → Blueprint** e selecione o repositório `MedGo`.
3. O Render lê o `render.yaml` e propõe dois serviços:
   `acolhe-api-gateway` e `acolhe-queue-service`. Confirme.
4. Ele vai pedir as variáveis marcadas como *sync: false*. Preencha:

   **acolhe-api-gateway**
   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do Neon |
   | `GOOGLE_CLIENT_ID` | `774842518562-...apps.googleusercontent.com,822822322864-...apps.googleusercontent.com` |
   | `QUEUE_SERVICE_URL` | deixe em branco por ora (preenche no passo 5) |
   | `RESEND_API_KEY` | deixe em branco (verificação de e-mail fica em modo log) |

   **acolhe-queue-service**
   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | a **mesma** do Neon |
   | `REDIS_URL` | a URL `rediss://` do Upstash |

   (`JWT_SECRET` e `JWT_REFRESH_SECRET` o Render gera sozinho.)
5. Após o primeiro deploy, copie a URL do queue-service
   (`https://acolhe-queue-service.onrender.com`) e cole em
   `QUEUE_SERVICE_URL` do gateway → **Save** (redeploy automático).

O gateway aplica o schema no Neon automaticamente no start
(`prisma db push`). Não é preciso rodar migração à mão.

### Popular dados de demonstração (opcional)

Com o gateway no ar, rode na sua máquina apontando para a URL de produção:
```bash
API=https://acolhe-api-gateway.onrender.com/api node scripts/seed.mjs
```
(veja `scripts/seed.mjs` — cria admin, pacientes, hospitais e planos).

## 4. Frontend — Vercel

No projeto `acolhe-med` → **Settings → Environment Variables**, defina para
*Production*:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://acolhe-api-gateway.onrender.com/api` |
| `NEXT_PUBLIC_QUEUE_SERVICE_URL` | `https://acolhe-queue-service.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `822822322864-...apps.googleusercontent.com` |

Depois **Deployments → Redeploy** (variáveis `NEXT_PUBLIC_*` entram no build).

## 5. Google Cloud Console

No OAuth Client usado em produção, confirme em *Authorized JavaScript
origins*:
```
https://acolhe-med.vercel.app
```
O login usa ID token (sem redirect), então não há *redirect URI* a
configurar. Se o app estiver em modo de teste, adicione sua conta em
*OAuth consent screen → Test users*.

---

## Checklist final

- [ ] Neon criado, `DATABASE_URL` copiada
- [ ] Upstash criado, `REDIS_URL` (rediss://) copiada
- [ ] Blueprint do Render aplicado, variáveis preenchidas
- [ ] `QUEUE_SERVICE_URL` do gateway apontando para o queue-service
- [ ] Vercel com `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_QUEUE_SERVICE_URL`
- [ ] Origem da Vercel autorizada no Google Console
- [ ] Redeploy da Vercel feito

Com tudo verde, `https://acolhe-med.vercel.app` funciona de ponta a ponta
para qualquer visitante.
