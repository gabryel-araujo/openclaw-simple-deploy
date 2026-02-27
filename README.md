# Simpleclaw Sync (MVP)

Plataforma de deploy 1-click para OpenClaw com foco no mercado brasileiro.

## Stack

- Next.js (App Router) + TypeScript
- Drizzle ORM + PostgreSQL
- API Route Handlers
- UI dark para setup/deploy do agente
- Vitest para testes unitários

## Funcionalidades MVP

- Criação de agente (`DRAFT`)
- Configuração de provider + Telegram (`CONFIGURED`)
- Deploy 1-click (adapter Railway, com modo stub local)
- Logs básicos
- Restart

## API (MVP)

- `POST /api/agents`
- `GET /api/agents`
- `GET /api/agents/:id`
- `POST /api/agents/:id/config`
- `POST /api/agents/:id/deploy`
- `GET /api/agents/:id/logs`
- `POST /api/agents/:id/restart`
- `GET /api/docs` (OpenAPI JSON)

## Setup

1. Instale dependências:
   - `npm install`
2. Configure ambiente:
   - `cp .env.example .env`
3. Gere/aplique schema:
   - `npm run db:push`
4. Rode local:
   - `npm run dev`

## Observações de produção

- Autenticação: hoje usa `x-user-id` fallback para acelerar MVP. Próximo passo é integrar Supabase Auth (Google OAuth) nos handlers.
- Deploy real Railway: o adapter está pronto com ponto de integração. Falta conectar chamadas reais da API Railway/CLI.
- Secrets: são criptografados com AES-GCM via `APP_SECRET`.
