# PRD — Deco + DecoCMS + MCP (chat‑first)

> Documento de requisitos do produto (PRD) para um sistema composto por: **Deco** (libs/APIs + sandbox de execução + storage), **DecoCMS** (shell/desktop com layout fixo: menu esquerdo, view central, chat direito) e **ecossistema MCP** (pacotes instaláveis que expõem tools, views e bindings). O sistema é **chat‑first**, baseado no protocolo MCP (Model Context Protocol), com priorização de ferramentas por contexto de view/app e mecanismos de **bindings** para Menu/Chat/View, **workflows** e **execução de código**.

---

## 1) Sumário executivo

Construir uma **plataforma Deco** baseada na **Cloudflare Workers** e no **protocolo MCP (Model Context Protocol)** com três pilares: (1) **Package Manager MCP** para instalar apps via interface web que expõem **tools** e **views**; (2) **Execution Sandbox** com acesso completo à infraestrutura Cloudflare (D1 SQLite, KV, R2, etc.); (3) **DecoFS** - sistema de configuração com API de filesystem **REALTIME** que permite comunicação entre partes do sistema. Em cima disso, oferecer a **shell DecoCMS** (desktop) — UI com **menu** (esq.), **view** (centro) e **chat** (dir.) — onde **tudo é tool call**, permitindo geração de código em runtime e total auditoria.

O sistema é **orientado a chat**: o agente conhece as tools disponíveis **priorizadas** por contexto (1º as da **view ativa**; 2º as do **app**; 3º as **tools do sistema**) e consegue: navegar, chamar RPCs de view (lista/paginação/seleção), executar workflows (com notification center), rodar código (runnable), capturar logs, e compartilhar/“deep‑linkar” estados da view.

---

## 2) Protocolo MCP e Diferencial

O **Model Context Protocol (MCP)** foi criado pela Anthropic para permitir que AIs acessem serviços externos de forma padronizada. No entanto, descobrimos que MCP é muito mais poderoso: é um protocolo universal para fazer qualquer sistema falar com qualquer outro sistema.

### Diferencial Único: MCPs que chamam MCPs

* **Interoperabilidade Nativa**: Apps MCP podem invocar tools de outros MCPs instalados no mesmo workspace
* **Descoberta Automática**: O coding agent conhece todas as tools e schemas disponíveis, facilitando integrações
* **Segurança Transparente**: Todas as chamadas são auditadas e controladas por permissões
* **Monetização Simples**: MCPs pagos consomem da wallet automaticamente, sem configuração de tokens

### Por que é Revolucionário

**"Tudo é Tool Call"**: O diferencial fundamental é que QUALQUER ação no sistema é um tool call registrado pela SDK tipada. Isso permite:

- **Geração de código em runtime**: O agente pode criar novas tools, views e workflows dinamicamente
- **Auditoria completa**: Toda interação é logada e rastreável
- **Contexto automático**: O agente sempre sabe o que está acontecendo
- **Permissões granulares**: Cada ação é verificada individualmente
- **Cloudflare nativo**: Tool calls diretos para D1 SQLite, KV, R2, Workers AI

Cada MCP criado para Claude/ChatGPT se torna automaticamente um plugin universal para qualquer app no sistema. É como se cada "tomada USB-C" pudesse falar com qualquer "dispositivo USB-C", criando um ecossistema de funcionalidades reutilizáveis.

## 3) Objetivos

* **O1. Chat‑first**: tornar o chat capaz de operar apps e views com zero configuração manual, apenas com **descoberta de tools/bindings**.
* **O2. Extensibilidade universal**: qualquer sistema externo vira "app" ao publicar um **MCP** com manifesto de tools/views/bindings.
* **O3. Operação unificada**: menu/view/chat **padronizados**; apps só implementam **bindings**.
* **O4. Execução segura**: **sandbox** com políticas de permissão e **autorização escalonável** quando uma tool exige escopo adicional.
* **O5. Tempo‑real**: RealtimeFS/ConfigState com **watch** para refletir mudanças instantâneas em views, editor, workflows e publish/diff.
* **O6. Navegação compartilhável**: **deep links** estáveis para estados internos de views (SPA‑like) e para conversas com contexto preservado.

### Métricas de sucesso (KPIs)

* **TTV (Time‑to‑Value)**: < 2 min do “instalar app MCP” até executar a primeira ação útil no chat.
* **Taxa de execução bem‑sucedida de toolcalls**: ≥ 95% (sem erro de escopo/permissão após autorizações).
* **Latência mediana de toolcall**: ≤ 800 ms (RPC intra‑workspace) e ≤ 2 s (chamadas remotas/sandbox).
* **Engajamento**: ≥ 60% das ações iniciadas via chat; ≥ 30% dos fluxos com uso do notification center.
* **Confiabilidade**: 99.9% de uptime do shell DecoCMS e registry MCP.

---

## 4) Escopo

### 4.1 MVP (Fase 1)

1. **Deco** na Cloudflare Workers: Package Manager MCP, DecoFS (config realtime), Execution Sandbox com acesso a D1 SQLite, KV, R2.
2. **DecoCMS Shell**: layout fixo (menu, view, chat), top bar básica, notification center, roteamento com wildcard (`*`) e camada HTTP `/mcp`.
3. **SDK Tipada**: geração automática de tipos TypeScript para todas as tools, permitindo geração de código com AI.
4. **Bindings iniciais**:

   * **MenuBinding** (entradas dinâmicas por app/MCP)
   * **ViewBinding** (registrar views; RPC/Tools; systemPrompt opcional; toolset declarado/descoberto)
   * **ChatBinding** (injetar contexto, **@refs** e **recent results**)
   * **WorkflowBinding** (criar/acompanhar/cancelar; progresso; notificação)
   * **RunnableBinding** (runCode/updateCode/getLogs)
4. **Prioridade de tools no agente**: View » App » Sistema.
5. **Default View para qualquer MCP** ("Ficha" + chat contextual).
6. **RealtimeFS** com watch para sincronizar view/editor/publish/diff.
7. **Deep links** para estado de view (compartilháveis).

### 4.2 Fases posteriores

* **Marketplace** (descoberta/ratings/versões) e **Tools Explorer**.
* **Captura de console do browser** para o agente.
* **Agents App** (ListAgent/RunAgent) com **dynamic tools**.
* **Notebook/Notepad** integrados (blocos markdown/código, env, runSQL, preview, geração in‑run).
* **Permissões avançadas** (escopos compostos, políticas por workspace/usuário/app).
* **Remix/Clone de views** e **dependências entre apps**.

### Fora de escopo (não‑objetivos)

* Construir um kernel ou substituto completo de SO.
* Editor visual genérico de UI fora dos bindings de view.
* Marketplace de agentes de terceiros (fase 1).

---

## 5) Personas & Casos de uso

* **Dev/Integrator (ex.: Tavano)**: publica MCP (tools/views), usa Runnable/Workflow, depura com logs, cria regras do agente (Cursor‑like rules).
* **Admin/Ecommerce (ex.: “Farm”)**: instala `deco.cx admin` + `Workflows`; navega **Pages** no menu; clica recursos; o chat traz contexto (`@Home`), executa ações (publicar, diff, revisar), acompanha jobs no notification center.
* **Maker/Analista**: cria notebooks; executa SQL/código; integra com sandbox; compartilha deep link da análise.

---

## 6) Princípios de design

1. **Chat é first‑class**: toda ação do sistema deve ser invocável pelo chat com o mesmo poder da UI.
2. **Bindings > componentes**: apps descrevem **o que** expõem (bindings), não **como** renderizar (sem switch‑case de componentes pré‑build).
3. **Contexto explícito**: view injeta tools e resultados recentes no agente (RPC/Toolcalls registrados). Menos “prompt mágico”, mais **contratos**.
4. **Autorização late‑bound**: falhas de escopo disparam fluxo de **Authorize** granular.
5. **Estado compartilhável**: qualquer estado relevante tem **deep link**.

---

## 7) Requisitos funcionais (RF)

**RF‑01** Instalar app via Package Manager MCP através da **interface web** (preenchendo schema de configuração e dependências).

**RF‑02** Registrar **tools** e **views** do app no workspace; aplicar **Default View** quando nenhuma view custom for fornecida.

**RF‑03** **MenuBinding**: app pode adicionar entradas ao menu (ex.: `Pages`, `Workflows`).

**RF‑04** **ViewBinding**: view declara URL (webapp/SPA), toolset auto-descoberto via SDK tipada, systemPrompt (opcional), e API simples para passar recursos selecionados.

**RF‑05** **ChatBinding**: view injeta contexto automaticamente através de **tool calls registrados** pela SDK tipada (tools, resultados, instruções) e **@referências** (ex.: `@Home`, `@PageList`, `@Section:hero`).

**RF‑06** **Prioridade de tools** no agente: (1) **View ativa**, (2) **App**, (3) **Sistema** (ex.: navegar, abrir terminal).

**RF‑07** **WorkflowBinding**: criar/ler status/cancelar workflow; emitir progresso/logs; exibir no **notification center** (pendentes/em execução/concluídos).

**RF‑08** **RunnableBinding**: rodar/atualizar código e coletar logs (stdout/stderr/diagnósticos). Suporte a preview quando aplicável.

**RF‑09** **Execution Sandbox**: terminal(s) isolados por workspace com políticas de recursos e redes; instalação de pacotes sob controle.

**RF‑10** **DecoFS**: Sistema de configuração com API de filesystem **REALTIME** que permite comunicação entre partes do sistema; integra **publish/diff** na top bar.

**RF‑11** **Tudo é Tool Call**: todas as ações são tool calls registradas pela SDK tipada (permissões, auditoria, contexto para agente). Não há `onPaginate()` - é a tool `listPages` que fornece contexto.

**RF‑12** **Deep link**: gerar/abrir links estáveis para o estado de uma view (inclui seleção de recurso/página/section).

**RF‑13** **Permissões**: modelo por **escopos**; falhas disparam **Authorize** contextual; registro de auditoria de concessões.

**RF‑14** **Console capture (posterior)**: opcionalmente capturar `console.log` da view para o chat/logs do agente.

**RF‑15** **Agents App (posterior)**: `ListAgent`, `RunAgent(message)`, publicação de agentes com toolsets dinâmicos.

**RF‑16** **Notebook/Notepad (posterior)**: blocos markdown/código; geração de blocos via chat; `env`, `runSQL`, preview; outputs encadeáveis.

---

## 8) Requisitos não funcionais (RNF)

* **Segurança**: isolamento por workspace; sandboxes com limites (CPU/mem/IO/network); política de escopos; secrets/ENV seguros.
* **Observabilidade**: tracing de toolcalls (id/correlation), métricas (latência/erros), logs de workflow, auditoria de autorizações.
* **Resiliência**: retry idempotente em toolcalls; circuit‑breaker para apps remotos.
* **Performance**: shell interativa < 100 ms TTFB; navegação view ↔ chat sem travas; streaming de respostas.
* **Compatibilidade**: mobile/desktop; SPA embutidas (iframe seguro ou micro‑front‑end).

---

## 9) Arquitetura & Componentes

### 9.1 Deco (Cloudflare Workers)

* **Package Manager MCP**: instala/atualiza/remove apps MCP através da interface web. Apps são servidores MCP que expõem manifesto com tools/views/bindings. Instalação via preenchimento de schema (incluindo dependências de outros MCPs).
* **Execution Sandbox**: acesso completo à infraestrutura Cloudflare - D1 SQLite (cada workspace tem seu banco), KV, R2, Workers AI, etc.
* **DecoFS**: Sistema de configuração com API de filesystem **REALTIME** - permite comunicação entre partes do sistema através de alterações de dados observáveis.

### 9.2 DecoCMS (shell/desktop)

* **Layout**: menu (esq.), view (centro), chat (dir.) — responsivo (desktop/mobile).
* **HTTP layer**: rota `/*` com wildcard para workspaces; namespace `/mcp` para registros e RPCs.
* **Top bar**: publish/diff (v1 simples; extensível por plugin).
* **Notification center**: pendentes/rodando/concluídos (workflows, long‑runs).

### 9.3 SDK Tipada e Views

* **Views**: Códigos de UI (React, HTML+JS) que renderizam componentes visuais e chamam tools através da SDK tipada.
* **SDK Tipada**: Geração automática de tipos TypeScript para todas as tools, permitindo que geração de código com AI funcione perfeitamente.
* **Auto-descoberta de Tools**: SDK captura automaticamente quais tools uma view chama para "registrá-la" na tool que retorna URL da view.
* **Middleware da SDK**: Intercepta tool calls para:
  - Verificar permissões do usuário no workspace
  - Salvar logs para auditoria
  - Armazenar dados para reuso (memória recente)
  - Informar contexto para o agente no chat

### 9.4 Bindings

* **MenuBinding**: `{ id, label, icon?, route?, openView? }`.
* **ViewBinding**: `{ id, title, url, toolset[] (auto-descoberto), systemPrompt?, resourceSelection? }`.
* **ChatBinding**: `{ toolCalls[], recentResults[], contextFromSDK }` (automático via SDK).
* **WorkflowBinding**: `{ create, getStatus, cancel, onProgress, getLogs }`.
* **RunnableBinding**: `{ runCode, updateCode, getLogs, getPreview? }`.
* **AgentsBinding (posterior)**: `{ listAgents, runAgent }`.

### 9.5 Prioridade de tools (agente)

1. **Tools da view ativa** (inclui RPCs usados para dados/botões na view).
2. **Tools do app** instalado (mesmo MCP).
3. **Tools do sistema** (navegar, abrir terminal, file picker, etc.).

### 9.6 Protocolo MCP e Interoperabilidade

* **MCP Nativo**: Sistema baseado no Model Context Protocol, originalmente criado pela Anthropic para AIs acessarem serviços, mas que se tornou excelente para qualquer criação de software.
* **MCPs podem chamar MCPs**: Diferencial único onde apps MCP podem invocar tools de outros MCPs instalados no workspace, tudo facilitado porque o coding agent conhece todas as tools e schemas disponíveis.
* **Segurança e Visibilidade**: Todas as chamadas entre MCPs são controladas por permissões e totalmente visíveis no sistema, com auditoria completa.
* **Marketplace de MCPs**: Apps básicos para conectar com serviços externos (Google Sheets, Discord, Gmail, Notion, BrasilAPI, VTEX) e serviços de AI (Midjourney, Anthropic, OpenAI).

### 9.7 Sistema de Wallet e MCPs Pagos

* **Wallet Deco**: Sistema de carteira digital onde usuários depositam dinheiro para usar MCPs pagos.
* **MCPs Pagos**: Ferramentas premium como `generateImage`, `perplexity.deepResearch` que consomem créditos da wallet automaticamente.
* **Transparência Total**: Todas as transações e consumos são visíveis ao usuário, sem necessidade de tokens externos ou configurações complexas.
* **Monetização**: Forma como a Deco cobra pelo serviço, permitindo que usuários acessem ferramentas poderosas sem gerenciar múltiplas assinaturas.

### 9.8 API de Views e Seleção de Recursos

* **API Simples**: Views podem passar para cima um resource/parte do JSON sendo editado que está selecionado pelo usuário.
* **Tool Calls Automáticos**: Não há `onPaginate()` - é a tool `listPages` que é chamada e fornece contexto ao agente automaticamente.
* **Tudo é Tool Call**: Sistema poderoso onde qualquer ação (listar, paginar, selecionar, abrir) é um tool call registrado pela SDK.
* **Capacidades Especiais**:
  - Geração de código em runtime com o agente (novas tools, views, workflows)
  - Tool calls diretos para APIs da Cloudflare (D1 SQLite, KV, R2, Workers AI)
  - Cada workspace tem SQLite próprio acessível via tool calls

---

## 10) Especificações de APIs/Contratos

### 10.1 Manifesto MCP (exemplo)

```json
{
  "name": "deco.cx-admin",
  "version": "0.1.0",
  "endpoints": {
    "rpc": "https://api.deco.cx/mcp/rpc",
    "views": [
      { "id": "pages", "url": "https://app.deco.cx/pages", "title": "Pages" }
    ]
  },
  "bindings": {
    "menu": [ { "id": "pages", "label": "Pages", "openView": "pages" } ],
    "view": [
      {
        "id": "pages",
        "toolset": ["listPages", "getPage", "updatePage", "publish"],
        "systemPrompt": "Você é o assistente de páginas do workspace...",
        "events": ["onSelect", "onPaginate", "onOpen", "onEdit"]
      }
    ],
    "workflow": [ { "id": "publishFlow", "tools": ["createWorkflow", "getStatus", "cancel", "getLogs"] } ],
    "runnable": [ { "id": "codeRunner", "tools": ["runCode", "updateCode", "getLogs"] } ]
  },
  "permissions": {
    "scopes": ["fs.read", "fs.write", "net.fetch:deco.cx", "sandbox.exec"]
  },
  "signature": "<detalhes>"
}
```

### 10.2 Tool description (Zod‑like schemas)

```json
{
  "name": "listPages",
  "description": "Lista páginas do site (paginado)",
  "inputSchema": {
    "type": "object",
    "properties": {"page": {"type": "number", "default": 1}, "size": {"type": "number", "default": 10}},
    "required": []
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "items": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "string"}, "title": {"type": "string"}}}},
      "page": {"type": "number"},
      "hasNext": {"type": "boolean"}
    }
  },
  "scopes": ["net.fetch:deco.cx"],
  "priority": 1
}
```

### 10.3 RPC envelope

```json
// Request
{
  "id": "uuid",
  "tool": "listPages",
  "from": "view:pages", // ou app/sistema
  "args": {"page": 1},
  "context": {"workspaceId": "ws_123", "userId": "u_456"}
}
// Response (streaming opcional)
{
  "id": "uuid",
  "ok": true,
  "result": {"items": [...], "page": 1, "hasNext": true},
  "logs": ["fetched 10 items"],
  "metrics": {"latencyMs": 123}
}
```

### 10.4 Autorização (late‑bound)

```json
{
  "error": "FORBIDDEN",
  "missingScopes": ["fs.write"],
  "authorize": {
    "reason": "Publicar página requer escrita em FS",
    "suggested": ["fs.write:pages/*"]
  }
}
```

O shell aciona UI de consentimento; ao conceder, reexecuta toolcall com escopos ampliados. Registro de auditoria é obrigatório.

### 10.5 Deep link (exemplo)

```
deco://ws/ws_123/app/deco.cx-admin/view/pages?route=/list&sel=page:home
```

Abre a view `pages` com seleção `home` e injeta `@Home` no chat.

---

## 11) Fluxos principais

### 11.1 Instalação de app (Farm)

1. Usuário acessa interface web e instala `deco.cx-admin` e `workflows` preenchendo schemas de configuração.
2. Durante instalação, sistema detecta dependências (ex: app precisa do Gmail MCP) e solicita seleção de qual MCP instalado usar.
3. Menu recebe entradas: **Pages**, **Work**.
4. Ao abrir **Pages**, a **ViewBinding** registra **toolset** e (opcional) **systemPrompt**; chat ganha contexto (tools + recentes).
5. Usuário clica na página `Home` → view emite `onSelect(@Home)` → chat referencia `@Home`.
6. Usuário pede "publicar" no chat → agente usa prioridade: View→App→Sistema; dispara workflow `publishFlow` → visível no **notification center**.

### 11.2 Edição granular (JSON pointer)

1. Preview da página renderiza JSON; usuário seleciona `section.hero`.
2. View emite `onEdit(@Section:hero)` → chat traz tool `updatePage` pré‑parametrizada.
3. Autorização solicitada se necessário; ao conceder, execução e logs retornam ao chat.

### 11.3 Execução de código (Runnable)

1. App expõe `runCode/updateCode/getLogs`.
2. Chat pede “rodar teste A/B” → sandbox cria job; logs streamam; preview opcional.
3. Se long‑running, workflow aparece no notification center; chat permanece livre para outras interações.

### 11.4 Navegação compartilhável

1. Usuário gera deep link da view com estado.
2. Outro usuário abre o link e vê a mesma seleção/contexto; o chat mostra **recent results** pertinentes.

### 11.5 Interoperabilidade entre MCPs

1. App de **Workflow** precisa enviar email → chama tool do MCP **Gmail** instalado no workspace.
2. Sistema verifica permissões e disponibilidade do MCP Gmail.
3. Coding agent facilita a integração conhecendo schemas de ambos os MCPs.
4. Execução é auditada e visível no sistema.
5. Se MCP Gmail for pago, consome créditos da wallet automaticamente.

---

## 12) UI/UX — diretrizes

* **Shell**: menu fixo (itens por app), view central (SPA/iframe isolado), chat lateral (com mentions, recent results, tool discovery).
* **Mentions**: `@resource` como chips clicáveis; histórico nos **recent results**.
* **Notification center**: persistente; mostra pendentes/rodando/concluídos; cada item linka para logs/resultado.
* **Top bar**: ações de `publish/diff`; extensível por plugin.
* **Permissão**: modal compacto com escopos solicitados e justificativa; persistência por workspace/app.
* **Console capture (posterior)**: aba de logs da view acoplada ao chat.

---

## 13) Dados & Modelos

**Workspace**: `{ id, name, apps[], policies, members[] }`

**App (MCP)**: `{ id, name, version, manifest, bindings, scopesGranted[], views[], tools[] }`

**Tool**: `{ name, description, inputSchema, outputSchema, scopes[], source(view|app|system), priority }`

**View**: `{ id, url, title, toolset[], systemPrompt?, routes[], state?, lastResults[] }`

**Workflow**: `{ id, type, status(pending|running|done|failed), createdAt, updatedAt, steps[], logsRef?, startedBy, metadata }`

---

## 14) GTM, Monetização & Pricing

**Tese**: habilitar criação de **MCPs**, adoção como **admin interno (DecoCMS)** e **vendas** via Marketplace com **cobrança por execução** através do sistema de **wallet Deco**.

**Motions**

* **PLG**: "Start with \$5 credit (no credit card)" + templates.
* **Sales‑assisted / Partners**: rede de implementadores certificados (Web/TS devs) para projetos custom.
* **Open‑source → Enterprise**: núcleo OSS (self‑host/BYOK) + add‑ons enterprise (SAML/SCIM, VPC peering, policy packs, controles FinOps).

**Packaging**

* **Core OSS** (runtime + control plane + SDK/CLI).
* **Marketplace** (módulos: agents/workflows/UIs/connectors; pacotes completos como **Storefront Suite**).
* **Wallet Deco**: Sistema unificado onde usuários depositam dinheiro e consomem automaticamente ao usar MCPs pagos (generateImage, perplexity.deepResearch, etc.) sem gerenciar tokens individuais.

**Cobrança (v1)**

* **Metering** por toolcall/step (execução, tokens, IO, tempo).
* **Billing** por wallet pré‑pago (saldo, créditos), **spend caps**, **alerts**.
* **Revenue share** p/ criadores no Marketplace (p.ex. 80/20) com relatórios.

**KPIs GTM**

* # de MCPs publicados/mês; # installs por MCP; % runs pagas.
* GMV do Marketplace; ARPU por workspace; CAC payback (< 3 meses).
* TTM do primeiro workflow: ≤ 30 dias (meta de onboarding).

**Canais**

* GitHub + templates; site /templates; comunidade; conteúdos “safe vibe coding”.
* Parcerias com consultorias/agências (revenda e delivery).

**Compliance & Legal**

* Termos p/ módulos pagos; auditoria de execução; exportabilidade de dados e logs.

**Foco 12 meses**

* **Criar MCPs**, consolidar DecoCMS como **admin interno** e **vender** (Marketplace/wallet), com casos exemplares (retail como exemplo sem restringir a categoria).

---

## 15) Positioning & Messaging (DecoCMS.com)

### 15.1 One‑Sentence Positioning

* **Headline**: *Deco is the home for all your AI apps.*
* **Clarifier**: *A generative control plane for data, tools, models, permissions, and memory — so you can prototype in chat, ship in code, and run & monetize agentic apps in production.*
* **Alt**: *“As easy to start as a chat app, as programmable as a workflow engine — inside one governed admin.”*

> **PT‑BR (opcional)**
> **Headline**: *Deco é a casa de todos os seus apps de IA.*
> **Clarifier**: *Um control plane generativo para dados, tools, modelos, permissões e memória — para prototipar no chat, shippar em código e operar/monetizar apps agentivos em produção.*

### 15.2 Why Now

* Gap **prompt → produção**: times não‑técnicos prototipam, mas produção exige política, multi‑tenancy, logging e FinOps.
* **Contexto é o produto**: padronizar um **context gateway** governado (conectores + policy + observabilidade) compartilhado por agentes e UIs.
* **Builders ≠ Ops**: UI bonita não basta; falta **runtime + control plane** auditável, escalável e extensível.
* **Monetização**: cauda longa de agentes internos precisa de distribuição + billing por execução.

### 15.3 Categoria & Âncoras

* **Categoria**: **Context CMS** (admin open‑source para agentes de IA).
* **Problema**: prototipar é fácil; produção (governança, custos, observabilidade) é difícil.
* **Use case**: construir, operar e **monetizar** apps agentivos sob seu stack.
* **Alternativa**: colar APIs de modelo + workflows + SaaS + governança DIY.
* **Persona**: devs Web/TS e parceiros; product/ops leaders.

### 15.4 Problema (tight)

Produção de software agentivo é caótica: auth, acesso a dados, roteamento de modelos, logging, custos e aprovações dispersos — protótipos empacam ou morrem em compliance.

**Sub‑problemas**

* Stack fragmentada (LLM aqui, workflow ali, UI acolá).
* RBAC/FinOps parafusados no fim.
* “Vibe debugging” em vez de operações reprodutíveis.
* Sem reuso/monetização de componentes.

### 15.5 Solução (o que é Deco)

**Deco = Context Management System** — **control plane + runtime** — que unifica sua stack agentiva ao redor do **contexto**.

* **Context Mesh (MCP‑native)**: conectores p/ dados/tools/modelos com policy, auth, RBAC, audit, spend caps.
* **Runtime unificado**: agentes/workflows/UIs no mesmo repo; deploy na edge; interfaces tipadas.
* **Superfície dupla**: prototipe no chat, **endureça em código** (SDK/CLI) sem trocar de plataforma.
* **Observabilidade**: logs, traces, erro analytics, **custo por step**.
* **Marketplace + wallet**: instalar/publicar módulos em 1‑clique, **billing por execução**.
* **Packages**: “OSs” completos dentro do DecoCMS (ex.: **Storefront Suite**, ex‑deco.cx).

### 15.6 Diferenciação

* **Control plane de contexto** (não só codegen): policy/roteamento governado + observabilidade.
* **Safe Vibe Coding**: todo run traçado, permissão escopada, custo com cap.
* **Um código, um deploy**: agentes/workflows/UIs juntos; sem vendor sprawl.
* **Billing por uso & monetização**: construa uma vez, **cobre por run**; wallet transparente.
* **Open & extensível**: self‑host/BYOK; core forkable; ecossistema de parceiros.

### 15.7 Promessas (trust)

* **Production‑safe by default**: RBAC, trilhas de auditoria, aprovações, spend caps.
* **Portável & aberto**: zero lock‑in; seu código, dados e chaves.
* **Prompt‑to‑production**: protótipos em chat viram software embarcável — **mesmo runtime**.
* **Marketplace leverage**: reuso do que funciona; monetize o que criar.

### 15.8 Capability → Feature → Benefit

* **Context Mesh** → conectores + policy + RBAC → **Contexto certo na hora certa — com segurança**.
* **Runtime unificado** → RPC tipado + edge → **Prototipe e entregue na mesma stack**.
* **Observabilidade** → logs/traces + custo/step → **Operação confiante; correção rápida**.
* **Governança** → auditoria, aprovações, caps → **Compliance e controle de risco/custo**.
* **Marketplace & wallet** → 1‑clique; billing por run → **Reuso imediato; monetização nativa**.
* **Packages** → Storefront Suite → **OSs de ponta a ponta no mesmo admin**.

### 15.9 Single Story per Page

* **/developers (GitHub)** — *Open‑source runtime for AI apps.*
  *Build agents, workflows, and UIs in one repo; connect your stack; deploy to the edge; publish modules—without vendor sprawl.*
* **/teams ou /founders** — *A single control plane for all your AI projects.*
  *Prototype in chat, then hand off to engineers to harden for production with roles, limits, audit, and clear costs.*

### 15.10 Homepage Copy (clear)

* **H1**: *The admin for your AI agents.*
* **H2**: *Connect context → compose agents, workflows, and UIs → deploy, observe, and bill per run.*
* **Bullets**

  * Prototype in chat; ship in code (same runtime)
  * Permissions, audit, spend caps out of the box
  * Install/publish via Marketplace; wallet billing
  * Open‑source; self‑host or BYOK
  * Train your team or tap certified partners
* **CTAs**: **Start with \$5 credit** (primary) | **See templates** / **Star on GitHub** (secondary)

### 15.11 Elevator Pitches

* **Geral (45–60s)**: *AI made demos easy; production is where it breaks — permissions, logging, costs, and compliance are missing. DecoCMS is the admin for your AI agents: connect your context (data, tools, models, permissions, memory), compose agents/workflows/UIs, and run them in production with roles, audit, limits, and per‑run billing. Prototype in chat, ship in code, and keep everything inside one governed admin. In 30 days, your first autonomous workflow goes live.*
* **Investor‑friendly (45–60s)**: *Next‑gen companies won’t win by renting bloated tools; they’ll win by running software tailored to how they operate. DecoCMS turns a company’s context into working automation — AI teammates and workflows that actually do the job. It’s production‑safe and extensible, with a marketplace so teams can install or sell modules with clear per‑run billing. Customers ship a live workflow in a month and scale on their own terms.*

### 15.12 Sales Deck — Títulos & Bullets

* **Cover**: *DecoCMS — the admin for your AI agents*
* **1.** *AI is easy to demo, hard to run*

  * Prototypes multiply; production stalls
  * Permissions, audit, and cost control arrive too late
* **3.** *You don’t need more tools — you need a home*

  * A control plane for context to operate agents
  * Apps that fit your processes and evolve with your data
* **5.** *Meet DecoCMS (Context CMS)*

  * MCP‑native connectors + guardrails; unified runtime; edge deploy
  * Logs, tracing, No Vibe Debugging, cost per step
* **7.** *Dual surface: chat for speed, SDK for scale*

  * Business prototypes quickly; engineers productionize without switching stacks
* **9.** *Packages & examples*

  * Storefront Suite (ex‑deco.cx) as an installable package
  * Templates: RFP Assistant, Fraud Triage, Content Ops, Scheduling, Knowledge Ops
* **11.** *Marketplace & wallet*

  * Build once, bill per run; one‑click installs
  * Partners monetize repeatable solutions
* **13.** *Open‑source, zero lock‑in*

  * Self‑host/BYOK; forkable core; composable components
* **15.** *Next steps*

  * Pick a template; start a pilot; certify your team

### 15.13 Use‑Case Templates (cross‑industry)

* Product Intake / Knowledge Ops (catalog & enrichment)
* RFP Assistant (B2B sales ops)
* Fraud Triage (fintech/transactions)
* Content Ops (media/marketing)
* Scheduling & Dispatch (field/logistics)
* Onboarding & Training (HR/compliance)

> *Use retail nos estudos de caso sem estreitar a categoria no headline.*

### 15.14 Competitive Posture

* **vs “AI app builders”**: inclui **runtime + control plane**, não só geração de UI.
* **vs workflow tools**: adiciona **governança de contexto** (RBAC, audit, caps) + código tipado e extensível.
* **vs SaaS vertical**: apps sob seu stack; open‑source, sem lock‑in; **monetize** seus módulos.

### 15.15 Definições

* **Context** = dados, tools, modelos, permissões, metas, memória
* **Context Mesh** = conectores governados + roteamento + observabilidade
* **Agentic app** = automação que planeja/age com aprovações e guardrails
* **Module** = pacote (agent/workflow/UI/connector) instalável via Marketplace
* **Per‑run billing** = cobrança por execução com wallet

### 15.16 Frases padronizadas

* “**Control plane for your AI stack.**”
* “**Prototype in chat. Ship in code.**”
* “**Safe Vibe Coding**”
* “**Build once, bill per run.**”
* “**Own your context. Own your tools.**”

> **Nota de foco estratégico**: alinhar narrativa, produto e GTM para **criar MCPs**, consolidar o **admin interno (DecoCMS)** e **vender** (Marketplace/wallet), priorizando monetização por execução e casos exemplares (e.g., Storefront Suite).
