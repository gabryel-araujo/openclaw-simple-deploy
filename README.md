<div align="center">

<br />

# 🔄 Simpleclaw Sync

### Deploy de agentes OpenClaw com 1 clique — sem DevOps, sem servidor, sem dor de cabeça.

<br />

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)

<br />

> Um produto **[Adapta](https://adapta.org)** ·

<br />

</div>

---

## ✨ O que é o Simpleclaw Sync?

**Simpleclaw Sync** é uma plataforma web que elimina toda a complexidade técnica de colocar um agente de IA do OpenClaw no ar. Em vez de configurar servidores, escrever Dockerfiles, lidar com variáveis de ambiente e depurar deploys — o usuário escolhe um **modelo de LLM**, conecta um **canal de comunicação** (Telegram hoje, Discord e WhatsApp em breve) e clica em **Deploy**.

O sistema cuida do resto: provisionamento no Railway, configuração do OpenClaw, injeção de secrets e monitoramento de status — tudo em menos de 5 minutos.

```
Usuário → Escolhe modelo → Conecta Telegram → Deploy  →  Bot 24/7 no ar
                                                 ↑
                          Railway + OpenClaw + Secrets (automático)
```

---

## 🚀 Features

| Feature                                                | Status    |
| ------------------------------------------------------ | --------- |
| Google OAuth (Supabase Auth)                           | ✅ MVP    |
| Seleção de modelo LLM (GPT, Claude, Gemini, Llama)     | ✅ MVP    |
| Integração Telegram (validação de token em tempo real) | ✅ MVP    |
| Deploy 1-click via Railway                             | ✅ MVP    |
| Dashboard de gerenciamento de agentes                  | ✅ MVP    |
| Logs básicos e restart do agente                       | ✅ MVP    |
| Billing com Mercado Pago                               | ✅ MVP    |
| BYOK — usuário traz a própria API Key                  | ✅ MVP    |
| Secrets criptografados com AES-GCM                     | ✅ MVP    |
| Integração Discord                                     | 🔜 Fase 2 |
| Integração WhatsApp                                    | 🔜 Fase 2 |
| Multi-agentes por usuário                              | 🔜 Fase 2 |
| Marketplace de templates                               | 🔜 Fase 3 |

---

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com separação clara em camadas:

```
src/
├── domain/                  # Entidades e tipos de negócio
│   ├── agent/               # Agent, AgentStatus, AgentSecrets
│   └── payment/             # Planos e regras de cobrança
│
├── application/             # Casos de uso (Services)
│   └── agent/               # AgentService, contratos
│
├── infrastructure/          # Implementações concretas
│   ├── auth/                # Supabase (server + client)
│   ├── deploy/              # RailwayDeploymentGateway
│   ├── repositories/        # DrizzleAgentRepository
│   ├── crypto/              # AES-GCM EncryptionService
│   └── db/                  # Schema Drizzle + cliente Neon
│
└── interfaces/
    └── http/                # Schemas de validação (Zod)

app/
├── api/                     # Route Handlers (Next.js App Router)
│   ├── agents/              # CRUD + deploy + logs + restart
│   ├── payment/             # Mercado Pago preference + webhook
│   ├── subscription/        # Status + histórico
│   └── telegram/            # Validação de token
│
└── dashboard/               # Pages protegidas
    ├── agents/
    ├── billing/
    ├── profile/
    └── settings/

components/
└── dashboard/               # BillingPage, DeployWizard, ProfileForm, SettingsPage ...
```

---

## 🔧 Stack Técnica

| Camada                | Tecnologia                                        |
| --------------------- | ------------------------------------------------- |
| **Frontend**          | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Auth**              | Supabase Auth — Google OAuth 2.0                  |
| **Banco de dados**    | PostgreSQL via Supabase + Drizzle ORM             |
| **Deploy de agentes** | Railway API (container Docker)                    |
| **Pagamentos**        | Mercado Pago (preferência + webhook)              |
| **Criptografia**      | AES-256-GCM via WebCrypto API                     |
| **Testes**            | Vitest                                            |

---

## 📡 API

| Método | Endpoint                         | Descrição                     |
| ------ | -------------------------------- | ----------------------------- |
| `POST` | `/api/agents`                    | Cria agente (`DRAFT`)         |
| `GET`  | `/api/agents`                    | Lista agentes do usuário      |
| `GET`  | `/api/agents/:id`                | Detalhes do agente            |
| `POST` | `/api/agents/:id/config`         | Configura provider + Telegram |
| `POST` | `/api/agents/:id/deploy`         | Inicia deploy no Railway      |
| `GET`  | `/api/agents/:id/logs`           | Logs do serviço               |
| `POST` | `/api/agents/:id/restart`        | Restart do serviço            |
| `POST` | `/api/payment/create-preference` | Cria preferência Mercado Pago |
| `POST` | `/api/payment/webhook`           | Webhook do Mercado Pago       |
| `GET`  | `/api/subscription/status`       | Status da assinatura          |
| `POST` | `/api/telegram/validate-token`   | Valida token de bot Telegram  |

---

## 🗺️ Roadmap

```
MVP ──────────────── Fase 2 ──────────────── Fase 3
│                    │                       │
├─ Auth Google       ├─ Multi-agentes        ├─ Marketplace
├─ Deploy Railway    ├─ Discord              ├─ Deploy híbrido
├─ Telegram          ├─ WhatsApp             ├─ Multi-tenancy
├─ Billing MP        ├─ Logs avançados       └─ Skills plugins
└─ Dashboard         └─ Templates de agentes
```

---

## 🔐 Segurança

- **Secrets do usuário** (API Keys de LLM) são criptografados com **AES-256-GCM** antes de serem persistidos no banco, usando `APP_SECRET` como chave derivada.
- **Autenticação** via Supabase Auth com Google OAuth — sem senhas locais.
- **Isolamento por usuário** — todos os agentes são filtrados por `user_id` nas queries e nas route handlers.
- **Webhook do Mercado Pago** validado com assinatura HMAC.

---

## 📄 Licença

MIT © [Adapta](https://adapta.org)

---

<div align="center">

Feito com ☕ e TypeScript no Brasil 🇧🇷

**[adapta.org](https://adapta.org)**

</div>
