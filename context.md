# 🇧🇷 Simpleclaw Sync – Plataforma de Deploy 1-Click para OpenClaw

- Principal referencia: https://www.simpleclaw.com/

## Visão Geral

O Simpleclaw Sync é uma plataforma web que permite usuários implantarem e gerenciarem agentes OpenClaw com apenas um clique, sem necessidade de conhecimentos técnicos em infraestrutura ou DevOps. O objetivo é eliminar a complexidade técnica de servidores e configurações, permitindo que o usuário tenha um bot de IA ativo 24/7 em menos de um minuto.

---

## Objetivos do Projeto

- Simplificar o deploy do OpenClaw
- Reduzir complexidade técnica para usuários não técnicos
- Permitir deploy local e cloud
- Interface intuitiva sem necessidade de usar terminal ou configurar cloud providers manualmente
- Oferecer painel de gerenciamento dos agentes
- Criar onboarding guiado

---

## Público-Alvo

- Desenvolvedores iniciantes
- Pequenas empresas
- Criadores de automações
- Usuários que querem assistentes IA pessoais
- Startups SaaS

---

## Principais Funcionalidades

### Deploy 1-Click

- Criação automática da infraestrutura
- Setup automático do OpenClaw
- Configuração automática de ambiente
- O usuário deve escolher qual "cérebro" a instância usará.

### Configuração do Agente

- Escolha do modelo LLM (Claude 3.5 Sonnet/Opus, GPT-4o, Gemini 1.5 Flash.)
- Configuração de personalidade do agente
- Configuração de ferramentas

### Integrações

- Telegram
- WhatsApp (futuro)
- Discord (futuro)
- O sistema deve estar preparado para receber as credenciais (API Keys/Tokens) desses canais após o deploy ou no momento da configuração.
- Escassez (UI): Exibir contador de "Limited cloud servers — only X left!" para incentivar a conversão.

### Gerenciamento

- Dashboard de status
- Logs do agente
- Controle de memória
- Restart e atualização do agente

---

## Arquitetura do Sistema

### Frontend

Tecnologias sugeridas:

- Next.js (App Router) + Route Handlers
- TypeScript
- Tailwind
- Shadcn UI

---

### Backend

Responsável por:

- Provisionamento de infraestrutura
- Orquestração de deploy
- Gerenciamento de usuários
- Armazenamento de configurações

Tecnologias sugeridas:

- Node.js
- Drizzle kit
- PostgreSQL
- Documentação do backend com swagger

---

### Infraestrutura

Responsável por:

- Criar serviços
- Configurar containers
- Executar OpenClaw
- Monitoramento

Tecnologias sugeridas:

- Docker
- Railway

Supabase = camada de dados/autenticação
Infra = containers / VPS / Cloud

### Variáveis de Ambiente Necessárias (Template):

O código deve ser capaz de injetar automaticamente:

- `DEFAULT_MODEL`
- `MESSAGING_CHANNEL`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`

---

## Fluxo do Deploy

1. Usuário cria conta ou faz login usando o google oAuth
2. Usuário escolhe modelo LLM
3. Usuário conecta canal (Telegram, etc.)
4. Sistema cria instância
5. Sistema instala OpenClaw
6. Sistema configura variáveis
7. Sistema inicia agente
8. Usuário acessa dashboard
9. Modelo de IA disponível para uso

---

## Regras de Negócio e Limitações

- Custo de API: O sistema deve monitorar o consumo dos $15 de créditos para evitar prejuízo. Se atingir o limite, a instância deve ser pausada ou o usuário deve ser notificado para fazer upgrade.
- Uptime: Garantir que o processo não morra (uso de orquestradores de container).

---

## Modelagem Inicial do Banco

### Users (tabela vinculada ao supabase auth)

- id
- email
- senha
- plano

### Agents

- id
- user_id
- nome
- modelo
- status
- canal

### Deployments

- id
- agent_id
- infraestrutura
- logs
- status

---

## Segurança

- Armazenamento seguro de tokens
- Isolamento de agentes por usuário (multi-tenancy)
- Controle de permissões
- Rotação de chaves

---

## Roadmap

### MVP

- Cadastro
- Deploy básico
- Integração Telegram
- Dashboard simples

### Fase 2

- Multi agentes
- Integração WhatsApp
- Logs avançados
- Templates de agentes

### Fase 3

- Marketplace de skills
- Multi tenancy
- Deploy híbrido (local + cloud)

---

## Regras para IA Desenvolvedora

Sempre seguir:

- Código limpo
- Padrão de projeto SOLID
- Separação clara e bem definida de responsabilidades
- Evitar completamente o hardcode
- Usar variáveis de ambiente
- Criar testes unitários
- Documentar o back-end com swagger
- Desenvolvimento sempre em camadas

---

## Padrões de Código

- Clean Architecture
- SOLID
- DDD simplificado

---

## Testes

- Testes unitários
- Testes de integração
- Testes de deploy

## Design e UI (Referências da Imagem)

- Tema: Dark mode (Fundo escuro, quase preto).
- Destaque: Efeito de brilho suave (glow) atrás do card principal.
- Tipografia: Sans-serif limpa e moderna.
- Feedback Visual: Indicação clara de qual modelo/canal está selecionado com bordas coloridas ou checkmarks.

---

## MVP Scope (Congelado)

### IN (MVP)

- Auth: Supabase Auth com Google OAuth
- 1 agente por usuário (por enquanto)
- Deploy do OpenClaw em 1 clique usando **Railway** (serviço/container)
- Integração: **Telegram somente**
- BYOK: usuário informa a própria API Key (OpenAI/Anthropic) no setup do agente
- Dashboard: listar agentes + status + botão deploy/restart + logs básicos

### OUT (Depois do MVP)

- Créditos internos ($15/month)
- WhatsApp/Discord
- Multi-agentes por usuário
- Marketplace/templates
- Deploy híbrido
- Billing/assinaturas

---

## Status do Agente (Enum)

- `DRAFT` (criado, não configurado)
- `CONFIGURED` (modelo + chave + canal prontos)
- `DEPLOYING`
- `RUNNING`
- `FAILED`
- `STOPPED`

---

## Modelo de Dados (MVP)

### agents

- id (uuid)
- user_id (uuid)
- name (text)
- model (text) // ex: "gpt-4o" | "claude-3.5-sonnet"
- channel (text) // "telegram"
- status (enum)
- railway_service_id (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### agent_secrets

- id (uuid)
- agent_id (uuid)
- provider (text) // "openai" | "anthropic"
- encrypted_api_key (text)
- created_at

### deployments

- id (uuid)
- agent_id (uuid)
- status (text) // "started" | "success" | "failed"
- logs (text, nullable)
- created_at

---

## API Contracts (MVP)

### POST /api/agents

Cria agente (status DRAFT)

Body:

- name
- model
- channel="telegram"

Returns:

- agent

### POST /api/agents/:id/config

Configura secrets/canal (status CONFIGURED)

Body:

- provider ("openai" | "anthropic")
- apiKey
- telegramBotToken
- telegramChatId (ou instruções para obter)

Returns:

- agent

### POST /api/agents/:id/deploy

Inicia deploy no Railway (status DEPLOYING)

Returns:

- { deploymentId, agent }

### GET /api/agents/:id

Returns:

- agent

### GET /api/agents/:id/logs

Returns:

- { logs: string }

### POST /api/agents/:id/restart

Restart do serviço
Returns:

- agent

---

## Deploy Model (MVP – Railway)

- Build de uma imagem Docker do OpenClaw (ou repo + Dockerfile)
- Ao clicar Deploy:
  1. criar serviço no Railway
  2. setar env vars do agente (DEFAULT*MODEL, MESSAGING_CHANNEL, PROVIDER_API_KEY, TELEGRAM*\*)
  3. iniciar serviço
  4. salvar railway_service_id no banco
  5. atualizar status para RUNNING ou FAILED

Env vars mínimas:

- DEFAULT_MODEL
- MESSAGING_CHANNEL=telegram
- PROVIDER_API_KEY (openai/anthropic)
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
