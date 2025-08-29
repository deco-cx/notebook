## Plano Próximo: Tornar o app instalável, Agent, Dynamic Tool Calls, HTML View e Atalhos

Este plano descreve um caminho objetivo, em etapas executáveis, para:
- Fazer o app ser instalável (PWA)
- Criar/expandir um Agent
- Habilitar Dynamic Tool Calls
- Criar uma HTML View
- Implementar atalhos com "/" e menções com "@" (incluir inserção de templates como "Criar Microsaas")

Cada tópico contém: objetivos, entregáveis, passos técnicos, alterações de arquivos, pacotes, critérios de aceite e riscos.

---

### 1) Fazer o app ser instalável (OAuth Deco)

- Objetivo: Permitir que usuários instalem o app em seus workspaces deco.chat, habilitando uso das tools de seus próprios workspaces.
- Entregáveis:
  - Fluxo OAuth funcional via `/oauth/start` (já existe no `user-button.tsx`)
  - Persistência de token/workspace do usuário logado
  - Acesso às tools do workspace do usuário após login

- Passos técnicos:
  1. OAuth Flow (já implementado):
     - O `view/src/components/user-button.tsx` já tem o link `/oauth/start` que inicia o processo.
     - Após login, usuário fica autenticado e o `env.DECO_CHAT_WORKSPACE_API` representa o workspace dele.
  2. Verificação de instalação:
     - Garantir que após login, o app consegue acessar `env.DECO_CHAT_WORKSPACE_API.INTEGRATIONS_LIST()`.
     - Testar se as tools do workspace do usuário são acessíveis via `INTEGRATIONS_CALL_TOOL`.
  3. UI de instalação:
     - O botão "Sign In" no `user-button.tsx` já serve como CTA de "instalação".
     - Após login, mostrar indicador de workspace conectado.

- Alterações de arquivos:
  - Verificar se `server/main.ts` está configurado para usar o workspace do usuário logado
  - Testar `view/src/components/user-button.tsx` (já tem o fluxo OAuth)
  - Opcional: melhorar UX pós-login para mostrar workspace conectado

- Pacotes:
  - Sem novos (infraestrutura já existe)

- Critérios de aceite:
  - Usuário clica "Sign In", faz OAuth, e fica logado com acesso ao workspace dele.
  - App consegue listar e usar tools do workspace do usuário via `DECO_CHAT_WORKSPACE_API`.

- Riscos:
  - Permissões de workspace; verificar se usuário tem acesso às tools necessárias.

---

### 2) Agent (chat + ferramentas)

- Objetivo: Disponibilizar um Agent no app que responda a prompts e possa acionar ferramentas aprovadas.
- Entregáveis:
  - Tool no servidor para chat do Agent (proxyando AI com schema)
  - Hook TanStack Query e componente de UI de chat

- Passos técnicos:
  1. Servidor (Tools):
     - Criar `server/tools/agent.ts` com um tool `AGENT_CHAT` que recebe `messages[]` e opcionalmente `tools` permitidas.
     - Implementar proxy para `env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT` conforme padrão do workspace.
     - Registrar em `server/tools/index.ts` e em `server/main.ts` dentro de `withRuntime`.
  2. Frontend:
     - Criar hook `view/src/hooks/useAgent.ts` com `useMutation` chamando `client.AGENT_CHAT`.
     - Criar UI: `view/src/components/Agent/Chat.tsx` e rota opcional `/apps/agent` (ou embutir no Notebook).
     - Persistência local (opcional): manter conversa em `localStorage` por sessão.

- Alterações de arquivos:
  - `server/tools/agent.ts`, `server/tools/index.ts`, `server/main.ts`
  - `view/src/lib/rpc.ts` (já existe padrão)
  - `view/src/hooks/useAgent.ts`, `view/src/components/Agent/Chat.tsx`, `view/src/routes/apps.tsx` (ou rota dedicada)

- Pacotes:
  - Sem novos (usa infraestrutura existente)

- Critérios de aceite:
  - Usuário envia mensagem e recebe resposta estruturada do Agent (sem travas).
  - Erros tratados e exibidos na UI.

- Riscos:
  - Cotas/limites do provedor de AI; mitigar com mensagens de erro claras.

---

#### 2.1) Detalhes de Implementação do Agent (AI SDK 5 Context)

**Contexto**: Agent conversacional que interage com o notebook atual via ícone de chat no header. Baseado na [AI SDK 5](https://vercel.com/blog/ai-sdk-5#agentic-loop-control) com `generateText` + `stopWhen` + tool calling nativo.

**Arquitetura do Agent:**

**A) Servidor - Rota `/stream` (AI SDK 5):**

```typescript
// server/main.ts (adicionar handler de rota)
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, stepCountIs, hasToolCall } from 'ai';

const handleAgentStream = async (request: Request, env: Env) => {
  const { messages, notebook, temperature = 0.3, maxSteps = 5 } = await request.json();
  
  const systemPrompt = `Você é um assistente especializado em notebooks de código/dados.

CONTEXTO DO NOTEBOOK:
- ID: ${notebook.id}
- Título: ${notebook.title}
- Total de células: ${notebook.cells.length}

CÉLULAS ATUAIS:
${notebook.cells.map((cell, i) => `
Célula ${i}: [${cell.type}] Status: ${cell.status}
Conteúdo: ${cell.content.slice(0, 300)}${cell.content.length > 300 ? '...' : ''}
${cell.outputs?.length ? `Outputs: ${JSON.stringify(cell.outputs.slice(0, 2))}` : 'Sem outputs'}
`).join('\n')}

FERRAMENTAS DISPONÍVEIS:
- addCell: Adicionar nova célula ao notebook
- updateCell: Editar conteúdo de célula existente  
- deleteCell: Remover célula (se não for a única)
- runQuery: Executar SQL queries no workspace
- searchGitHub: Buscar issues/repos no GitHub

DIRETRIZES:
- Analise o contexto antes de responder
- Use tool calls para modificar o notebook quando solicitado
- Seja conciso mas informativo`;

  // Configurar modelo Anthropic
  const model = anthropic('claude-3-5-sonnet-20241022', {
    apiKey: env.ANTHROPIC_API_KEY,
  });

  // Definir tools disponíveis
  const tools = {
    addCell: tool({
      description: 'Adicionar nova célula ao notebook',
      parameters: z.object({
        type: z.enum(['markdown', 'javascript', 'python', 'json', 'html']),
        content: z.string(),
        position: z.enum(['end', 'after', 'before']).optional().default('end')
      }),
      execute: async ({ type, content, position }) => {
        return { success: true, action: 'addCell', type, content, position };
      }
    }),
    
    updateCell: tool({
      description: 'Editar conteúdo de célula existente',
      parameters: z.object({
        cellIndex: z.number(),
        content: z.string()
      }),
      execute: async ({ cellIndex, content }) => {
        return { success: true, action: 'updateCell', cellIndex, content };
      }
    }),
    
    deleteCell: tool({
      description: 'Remover célula do notebook',
      parameters: z.object({
        cellIndex: z.number()
      }),
      execute: async ({ cellIndex }) => {
        return { success: true, action: 'deleteCell', cellIndex };
      }
    }),
    
    runQuery: tool({
      description: 'Executar query SQL no workspace',
      parameters: z.object({
        sql: z.string(),
        params: z.array(z.any()).optional()
      }),
      execute: async ({ sql, params }) => {
        const result = await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({ sql, params });
        return { success: true, action: 'queryResult', data: result };
      }
    })
  };

  // Usar streamText com stopWhen para controle de loop
  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools,
    temperature,
    maxTokens: 2000,
    stopWhen: [
      stepCountIs(maxSteps),
      hasToolCall('finalAnswer')
    ]
  });

  return result.toDataStreamResponse();
};

// No main handler:
const handleRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  
  if (url.pathname === '/stream' && request.method === 'POST') {
    return await handleAgentStream(request, env);
  }
  
  // ... resto dos handlers
};
```

**A.1) Configuração da API Key Anthropic:**

```typescript
// server/main.ts ou .env
// Adicionar variável de ambiente para Anthropic API Key
export interface Env {
  ANTHROPIC_API_KEY: string;
  // ... outras vars
}

// No wrangler.toml:
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

**B) Tools para modificar notebook:**

```typescript
// server/tools/agent.ts (continuação)
export const createNotebookModifyTool = (env: Env) => createTool({
  id: "NOTEBOOK_MODIFY",
  description: "Modifica células do notebook",
  inputSchema: z.object({
    action: z.enum(["add", "update", "delete"]),
    cellIndex: z.number().optional(),
    cellType: z.enum(["markdown", "javascript", "python", "json", "html"]).optional(),
    content: z.string().optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    newCellId: z.string().optional()
  }),
  execute: async ({ context }) => {
    switch (context.action) {
      case "add":
        return {
          success: true,
          message: `Célula ${context.cellType} adicionada`,
          newCellId: `cell_${Date.now()}`
        };
      case "update":
        return {
          success: true,
          message: `Célula ${context.cellIndex} atualizada`
        };
      case "delete":
        return {
          success: true,
          message: `Célula ${context.cellIndex} removida`
        };
      default:
        throw new Error("Ação não suportada");
    }
  }
});
```

**C) Frontend - Hook com `useChat` da AI SDK:**

```typescript
// view/src/hooks/useNotebookAgent.ts
import { useChat } from 'ai/react';
import { useEffect } from 'react';

export function useNotebookAgent(notebook, onNotebookChange, cellActions) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    setMessages
  } = useChat({
    api: '/stream', // Rota que criamos no servidor
    body: {
      notebook: {
        id: notebook.id,
        title: notebook.title,
        cells: notebook.cells.map(cell => ({
          id: cell.id,
          type: cell.type,
          content: cell.content,
          status: cell.status,
          outputs: cell.outputs || []
        }))
      },
      temperature: 0.3,
      maxSteps: 5
    },
    onToolCall: async ({ toolCall }) => {
      // Processar tool calls em tempo real durante o streaming
      if (toolCall.toolName === 'addCell') {
        cellActions.addCell(
          toolCall.args.type || 'markdown',
          toolCall.args.content || ''
        );
        return { success: true, message: `Célula ${toolCall.args.type} adicionada` };
      } else if (toolCall.toolName === 'updateCell') {
        cellActions.updateCell(
          toolCall.args.cellIndex,
          { content: toolCall.args.content }
        );
        return { success: true, message: `Célula ${toolCall.args.cellIndex} atualizada` };
      } else if (toolCall.toolName === 'deleteCell') {
        cellActions.deleteCell(toolCall.args.cellIndex);
        return { success: true, message: `Célula ${toolCall.args.cellIndex} removida` };
      }
      
      // Para outras tools, apenas retornar sucesso
      return { success: true };
    },
    onError: (error) => {
      console.error('Agent error:', error);
    }
  });

  const sendMessage = (content: string) => {
    append({ role: 'user', content });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
    clearChat,
    hasMessages: messages.length > 0,
    isStreaming: isLoading
  };
}
```

**D) Frontend - UI do Chat Agent (com useChat):**

```typescript
// view/src/components/Agent/NotebookChat.tsx
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

export function NotebookChat({ notebook, onNotebookChange, cellActions }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    clearChat,
    hasMessages
  } = useNotebookAgent(notebook, onNotebookChange, cellActions);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <MessageCircle className="h-[18px] w-[18px]" />
          {hasMessages && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-row items-center justify-between">
          <div>
            <SheetTitle>Notebook Agent</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Chat com "{notebook.title}" ({notebook.cells.length} células)
            </p>
          </div>
          {hasMessages && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </SheetHeader>

        {/* Messages com streaming em tempo real */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Converse com o agent sobre seu notebook.</p>
              <p className="text-xs mt-2">Posso analisar, modificar células e executar tools...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Tool calls display (AI SDK 5 format) */}
                  {message.toolInvocations?.length && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-xs opacity-70 mb-1">Ações executadas:</p>
                      {message.toolInvocations.map((tool, i) => (
                        <div key={i} className="text-xs bg-background/20 rounded p-1 mb-1">
                          {tool.toolName}({Object.keys(tool.args).join(', ')})
                          {tool.result?.message && ` → ${tool.result.message}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-xs">Pensando...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
              Erro: {error.message}
            </div>
          )}
        </div>

        {/* Input com submit handler da AI SDK */}
        <div className="flex-shrink-0 pt-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2">
            Agent com streaming em tempo real e modificação automática do notebook.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**E) Available Tools Integration:**

O agent terá acesso às tools de `availableTools.ts`:
- `DATABASES_RUN_SQL`: Executar queries
- `PROFILES_GET`: Obter perfil  
- `GITHUB_LUCIS.LIST_REPO_ISSUES`: Buscar issues
- `SELF.RUN_CELL`: Gerar células via AI

**F) Capacidades:**
- Análise contextual do notebook
- Modificação de células (add/edit/delete)
- Execução de queries SQL
- Busca no GitHub
- Geração de código/visualizações
- Análise de outputs existentes

**G) Integração no Header existente:**

```typescript
// view/src/components/site-header.tsx (linha 91-93)
// Substituir:
<Button variant="ghost" size="icon" className="h-9 w-9">
  <MessageCircle className="h-[18px] w-[18px]" />
</Button>

// Por:
<NotebookChat 
  notebook={currentNotebook} 
  onNotebookChange={onNotebookChange}
  cellActions={cellActions}
/>
```

**H) Fluxo de dados completo:**

1. **Usuário → Frontend**: Clica chat, digita mensagem
2. **Frontend → Servidor**: `client.NOTEBOOK_AGENT_CHAT({ messages, notebook })`
3. **Servidor → AI**: Chama `AI_GENERATE_OBJECT` com contexto do notebook + available tools
4. **AI → Servidor**: Retorna resposta + tool calls (se necessário)
5. **Servidor → Frontend**: Retorna mensagem + tool invocations
6. **Frontend**: Aplica tool invocations via `cellActions` (addCell, updateCell, deleteCell)
7. **Frontend**: Atualiza UI do chat + notebook modificado

**I) System Prompt detalhado:**

```typescript
const systemPrompt = `Você é um assistente especializado em notebooks de código/dados.

CONTEXTO DO NOTEBOOK:
- ID: ${notebook.id}
- Título: ${notebook.title}
- Total de células: ${notebook.cells.length}

CÉLULAS ATUAIS:
${notebook.cells.map((cell, i) => `
Célula ${i}: [${cell.type}] Status: ${cell.status}
Conteúdo: ${cell.content.slice(0, 300)}${cell.content.length > 300 ? '...' : ''}
${cell.outputs?.length ? `Outputs: ${JSON.stringify(cell.outputs.slice(0, 2))}` : 'Sem outputs'}
`).join('\n')}

TOOLS DISPONÍVEIS:
- addCell(type, content): Adicionar nova célula
- updateCell(cellIndex, content): Editar célula existente
- deleteCell(cellIndex): Remover célula
- runQuery(sql): Executar SQL no workspace
- searchGitHub(owner, repo, query): Buscar no GitHub
- getProfile(): Obter dados do usuário

DIRETRIZES:
- Analise o contexto antes de responder
- Sugira melhorias baseadas no conteúdo atual
- Use tool calls para modificar o notebook quando solicitado
- Seja conciso mas informativo
- Priorize ações que agreguem valor ao notebook`;
```

**J) Atualização necessária do schema `RUN_CELL`:**

O schema atual do `RUN_CELL` em `server/tools/notebook.ts` precisa ser expandido para suportar todos os tipos de células disponíveis:

```typescript
// server/tools/notebook.ts (atualizar schema)
outputSchema: z.object({
  cellsToAdd: z.array(z.object({
    type: z.enum(["markdown", "javascript", "python", "html", "json", "excalidraw", "workflow"]), // Expandir tipos
    content: z.string(),
    selectedView: z.string().optional(), // View padrão para a célula
    viewData: z.record(z.any()).optional() // Dados específicos da view
  }))
}),

// Atualizar prompt para incluir novos tipos:
"REGRAS:\n" +
"1) Gere células apropriadas: markdown (texto), javascript/python (código), html (interfaces), json (dados), excalidraw (diagramas).\n" +
"2) Para HTML, inclua scripts que usem window.callTool() para acessar workspace tools.\n" +
"3) Para visualizações, prefira HTML com Chart.js ou D3.js.\n" +
"4) Para diagramas, use excalidraw ou HTML com SVG.\n" +
"5) Sempre termine código com return para capturar output.\n\n"
```

**K) Exemplos de interações:**

- **Análise**: "Analise os dados da célula 2 e crie uma visualização" → Gera HTML com gráfico
- **Código**: "Adicione uma célula Python para plotar gráfico dos dados" → Gera python cell
- **Query**: "Execute uma query SQL e mostre em tabela" → Gera JS + HTML com tabela
- **GitHub**: "Busque issues sobre 'auth' no repo react" → Gera JS com chamada + HTML para exibir
- **Diagrama**: "Crie um fluxograma do processo" → Gera excalidraw cell
- **Interface**: "Crie um dashboard dos dados" → Gera HTML interativo com tools access


### 3) Dynamic Tool Calls

- Objetivo: Descobrir e executar tools dinamicamente de todas as integrações do workspace, substituindo `availableTools.ts` estático.
- Entregáveis:
  - Tool para listar todas as integrações e suas URLs
  - Tool para fazer fetch direto em cada integração MCP e obter lista de tools com schemas
  - Tool dispatcher que executa tools por `integrationId` + `toolName` + `input`
  - Substituição do sistema atual `availableTools.ts` por descoberta dinâmica

- Passos técnicos:
  1. **Tool para descobrir integrações:**
     ```typescript
     // server/tools/dynamicTools.ts
     const createDiscoverIntegrationsTool = (env: Env) => createTool({
       id: "DISCOVER_INTEGRATIONS",
       description: "Lista todas as integrações MCP do workspace",
       inputSchema: z.object({}),
       outputSchema: z.object({
         integrations: z.array(z.object({
           id: z.string(),
           name: z.string(),
           connection: z.object({
             type: z.string(),
             url: z.string(),
             token: z.string().optional()
           })
         }))
       }),
       execute: async () => {
         const result = await env.DECO_CHAT_WORKSPACE_API.INTEGRATIONS_LIST({});
         return { integrations: result.items || [] };
       }
     });
     ```

  2. **Tool para listar tools de uma integração via fetch direto:**
     ```typescript
     const createListToolsFromIntegrationTool = (env: Env) => createTool({
       id: "LIST_TOOLS_FROM_INTEGRATION",
       description: "Lista tools de uma integração específica via fetch direto MCP",
       inputSchema: z.object({
         connection: z.object({
           type: z.string(),
           url: z.string(),
           token: z.string().optional(),
         }).describe("Objeto de conexão MCP da integração")
       }),
       outputSchema: z.object({
         tools: z.array(z.object({
           name: z.string(),
           description: z.string().optional(),
           inputSchema: z.any().optional(),
           outputSchema: z.any().optional()
         }))
       }),
       execute: async ({ context }) => {
         const { connection } = context;
         
         // Para conexões HTTP/SSE, fazer chamada JSON-RPC direta
         if (connection.type === "HTTP" || connection.type === "SSE") {
           const headers: Record<string, string> = {
             "Content-Type": "application/json",
           };
           
           if (connection.token) {
             headers["Authorization"] = `Bearer ${connection.token}`;
           }
           
           // Chamada JSON-RPC 2.0 para tools/list
           const response = await fetch(connection.url, {
             method: "POST",
             headers,
             body: JSON.stringify({
               jsonrpc: "2.0",
               method: "tools/list",
               params: {},
               id: 1,
             }),
           });
           
           if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
           }
           
           const data = await response.json();
           const tools = data.result?.tools || [];
           
           return { tools };
         }
         
         throw new Error(`Tipo de conexão ${connection.type} não suportado`);
       }
     });
     ```

  3. **Tool agregadora que substitui availableTools.ts:**
     ```typescript
     const createDiscoverAllToolsTool = (env: Env) => createTool({
       id: "DISCOVER_ALL_TOOLS",
       description: "Descobre todas as tools disponíveis no workspace dinamicamente",
       inputSchema: z.object({}),
       outputSchema: z.object({
         tools: z.array(z.object({
           name: z.string(),
           description: z.string().optional(),
           integration: z.string(),
           fullName: z.string(), // integrationId.toolName
           inputSchema: z.any().optional(),
           outputSchema: z.any().optional()
         }))
       }),
       execute: async () => {
         const allTools = [];

         // 1. Descobrir integrações
         const discoverIntegrations = createDiscoverIntegrationsTool(env);
         const { integrations } = await discoverIntegrations.execute({ context: {} });

         // 2. Para cada integração, listar suas tools
         const listToolsFromIntegration = createListToolsFromIntegrationTool(env);
         
         for (const integration of integrations) {
           try {
             const { tools } = await listToolsFromIntegration.execute({ 
               context: { connection: integration.connection } 
             });

             tools.forEach(tool => {
               allTools.push({
                 name: tool.name,
                 description: tool.description,
                 integration: integration.name || integration.id,
                 fullName: `${integration.id}.${tool.name}`,
                 inputSchema: tool.inputSchema,
                 outputSchema: tool.outputSchema
               });
             });
           } catch (error) {
             console.warn(`Erro ao processar integração ${integration.name}:`, error);
           }
         }

         // 3. Adicionar tools locais (SELF)
         // ... adicionar tools do próprio servidor

         return { tools: allTools };
       }
     });
     ```

  4. **Tool dispatcher dinâmica:**
     ```typescript
     const createDynamicToolCallerTool = (env: Env) => createTool({
       id: "DYNAMIC_TOOL_CALL",
       description: "Executa uma tool específica por integrationId e toolName",
       inputSchema: z.object({
         integrationId: z.string(),
         toolName: z.string(),
         input: z.record(z.any())
       }),
       outputSchema: z.object({
         result: z.any(),
         success: z.boolean()
       }),
       execute: async ({ context }) => {
         // Usar INTEGRATIONS_CALL_TOOL para executar
         const result = await env.DECO_CHAT_WORKSPACE_API.INTEGRATIONS_CALL_TOOL({
           connection: { type: "Deco", tenant: "workspace" }, // Usar conexão do workspace
           params: {
             name: context.toolName,
             arguments: context.input
           }
         });
         
         return { result, success: true };
       }
     });
     ```

- Alterações de arquivos:
  - `server/tools/dynamicTools.ts` (novo arquivo)
  - `server/tools/index.ts` (adicionar dynamic tools)
  - `view/src/utils/availableTools.ts` (substituir por hook que chama `DISCOVER_ALL_TOOLS`)
  - `view/src/hooks/useDynamicTools.ts` (novo hook para descoberta)

- Pacotes:
  - Sem novos (usa fetch nativo)

- Critérios de aceite:
  - `DISCOVER_ALL_TOOLS` retorna lista completa de tools de todas integrações.
  - `DYNAMIC_TOOL_CALL` executa tool específica com input validado.
  - Sistema substitui `availableTools.ts` estático por descoberta dinâmica.

- Riscos:
  - Latência na descoberta inicial; mitigar com cache.
  - Integrações offline/inacessíveis; tratar erros graciosamente.

---

### 4) Criar HTML View (com acesso ao env)

- Objetivo: Renderizar conteúdo HTML dentro de uma célula, com capacidade de executar scripts que acessam tools do `env` (similar às células JavaScript).
- Entregáveis:
  - Novo componente `HtmlView` com sanitização e injeção de `env` global
  - Registro no catálogo de views e suporte no Notebook
  - Sistema de execução de scripts HTML com acesso às tools

- Passos técnicos:
  1. **Componente HtmlView com env injection:**
     ```typescript
     // view/src/components/Views/HtmlView.tsx
     export function HtmlView({ cell, onContentChange, isFullscreen, notebook }: ViewProps) {
       const [processedHtml, setProcessedHtml] = useState('');
       
       useEffect(() => {
         // Criar env global similar ao JavaScript execution
         const env = createExecutionEnvironment(notebook);
         
         // Injetar env como global no HTML
         const envScript = `
           <script>
             window.env = ${JSON.stringify(createSerializableEnv(env))};
             
             // Wrapper functions para manter async/await
             window.callTool = async (toolName, params) => {
               const response = await fetch('/api/tool-call', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ toolName, params })
               });
               return await response.json();
             };
           </script>
         `;
         
         // Sanitizar HTML e injetar script do env
         const sanitizedHtml = DOMPurify.sanitize(cell.content);
         const htmlWithEnv = envScript + sanitizedHtml;
         
         setProcessedHtml(htmlWithEnv);
       }, [cell.content, notebook]);

       return (
         <div className={`html-view ${isFullscreen ? 'h-full p-4' : 'h-64'}`}>
           <iframe
             srcDoc={processedHtml}
             className="w-full h-full border-2 border-gray-600 rounded bg-white"
             sandbox="allow-scripts allow-same-origin"
             title="HTML Preview with Env"
           />
         </div>
       );
     }
     ```

  2. **API route para tool calls do HTML:**
     ```typescript
     // server/main.ts (adicionar rota)
     const handleRequest = async (request: Request, env: Env) => {
       const url = new URL(request.url);
       
       if (url.pathname === '/api/tool-call' && request.method === 'POST') {
         const { toolName, params } = await request.json();
         
         // Executar tool via TOOL_CALL existente
         const result = await client.TOOL_CALL({ toolName, params });
         
         return new Response(JSON.stringify(result), {
           headers: { 'Content-Type': 'application/json' }
         });
       }
       
       // ... resto do handler
     };
     ```

  3. **Env serialization para HTML:**
     ```typescript
     // view/src/hooks/core/useNotebookExecution.ts (adicionar)
     const createSerializableEnv = (env: any) => {
       // Converter functions para referências que serão chamadas via fetch
       return {
         DATABASES: {
           RUN_SQL: '$$TOOL_CALL:DATABASES_RUN_SQL'
         },
         PROFILES: {
           GET: '$$TOOL_CALL:PROFILES_GET'
         },
         // ... outras tools
       };
     };
     ```

  4. **Exemplo de uso em HTML:**
     ```html
     <!-- Exemplo de célula HTML com acesso ao env -->
     <div id="results"></div>
     <button onclick="loadData()">Carregar Dados</button>
     
     <script>
       async function loadData() {
         try {
           const result = await window.callTool('DATABASES_RUN_SQL', {
             sql: 'SELECT * FROM users LIMIT 10'
           });
           
           document.getElementById('results').innerHTML = 
             '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
         } catch (error) {
           console.error('Erro ao carregar dados:', error);
         }
       }
     </script>
     ```

- Alterações de arquivos:
  - `view/src/components/Views/HtmlView.tsx` (novo, com env injection)
  - `view/src/utils/availableViews.ts` (registrar HTML view)
  - `server/main.ts` (adicionar rota `/api/tool-call`)
  - `view/src/hooks/core/useNotebookExecution.ts` (adicionar `createSerializableEnv`)

- Pacotes:
  - `dompurify`

- Critérios de aceite:
  - HTML renderiza com segurança (XSS mitigado)
  - Scripts HTML podem chamar `window.callTool()` para acessar tools do workspace
  - Funciona similar às células JavaScript mas em contexto HTML

- Riscos:
  - XSS se sanitização falhar; usar `dompurify` rigorosamente
  - Same-origin policy no iframe; configurar sandbox adequadamente

---

### 5) Atalhos: "/" (slash) e menções "@" + Templates

- Objetivo: Melhorar UX de edição com comandos rápidos e menções a variáveis, além de inserir células a partir de templates (ex: "Criar Microsaas").
- Entregáveis:
  - Slash command no TipTap exibindo um menu com ações (inserir célula, inserir template, etc.)
  - Menções com "@" para variáveis/contexto do notebook
  - Inserção de templates que criam múltiplas células pré-configuradas

- Passos técnicos:
  1. TipTap Slash Command:
     - Usar `@tiptap/suggestion` para implementar um `SlashCommand` custom.
     - Opções do menu: "Texto", "HTML", "Inserir Template: Criar Microsaas", etc.
     - Integrar no `view/src/hooks/components/useTipTapEditor.ts` adicionando a extensão.
  2. Menções "@":
     - Usar `@tiptap/extension-mention` com `suggestion` e fonte de dados das variáveis do notebook.
     - Renderização inline e persistência do token de variável.
  3. Templates:
     - Definir estrutura de templates (arquivo TS com definição) p.ex. `view/src/utils/templates.ts`.
     - Implementar ação do slash menu que, ao selecionar o template, insere conjunto de células no Notebook (usar hooks existentes de manipulação de células).

- Alterações de arquivos:
  - `view/src/hooks/components/useTipTapEditor.ts`
  - `view/src/components/Notebook/Notebook.tsx` (se precisar de handlers para inserir múltiplas células)
  - `view/src/utils/templates.ts` (novo)
  - `view/src/components/Cell/` (se novos tipos de célula forem criados)

- Pacotes:
  - `@tiptap/suggestion`
  - `@tiptap/extension-mention`

- Critérios de aceite:
  - Digitando "/" abre menu com opções e executa a ação escolhida.
  - Digitando "@" lista variáveis disponíveis e insere menção vinculada.
  - Selecionar "Criar Microsaas" insere o conjunto de células esperadas.

- Riscos:
  - Conflitos de keymaps; mitigar isolando escopos e testando em diferentes views.

---

### 6) Sequenciamento sugerido (curto prazo)

1. **Atualizar schema `RUN_CELL`** (30min) — expandir tipos suportados para incluir html, python, json, excalidraw, workflow
2. **OAuth Deco** (já funciona) — testar login e acesso ao workspace do usuário
3. **HTML View com env** (2h) — renderização + `window.callTool()` + rota `/api/tool-call`
4. **Dynamic Tool Calls** (4h) — descoberta via fetch JSON-RPC + substituir `availableTools.ts`
5. **Agent (AI SDK 5)** (6h) — rota `/stream` + `useChat` + tool calling em tempo real
6. **Atalhos TipTap** (4h) — "/" slash commands + "@" menções + templates

Estimativa macro: 2-3 dias úteis, com foco na descoberta dinâmica de tools.

---

### 7) Testes e QA

- PWA: Lighthouse, teste de instalação em Chrome/Edge/Android/iOS.
- Agent e Tool Calls: mocks de RPC; testes de erro e timeouts.
- HTML View: sanitização verificada com payloads maliciosos.
- Slash/menções: testes de teclado, foco, inserção e undo/redo.

---

### 8) Comandos e dependências

Instalações (servidor - AI SDK 5):
```
cd server
npm i ai @ai-sdk/anthropic zod-to-json-schema
```

Instalações (frontend - AI SDK 5 + outras features):
```
cd view
npm i ai @ai-sdk/react vite-plugin-pwa dompurify @tiptap/suggestion @tiptap/extension-mention
```

Configuração da API Key Anthropic:
```bash
# No server/wrangler.toml:
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

Build/dev:
```
npm run dev
```

Tipos/self-gen (após novos tools/workflows no server rodando):
```
DECO_SELF_URL=<url-dev-com-/mcp> npm run gen:self
```

---

### 9) Definição de Pronto (DoD)

- **OAuth Deco**: Usuários podem fazer login via `/oauth/start` e acessar tools do próprio workspace
- **Agent (AI SDK 5)**: Rota `/stream` funcional com `streamText`, `useChat`, `onToolCall` em tempo real e API key Anthropic
- **Dynamic Tool Calls**: Descoberta automática via fetch JSON-RPC direto nas integrações MCP (substitui `availableTools.ts`)
- **HTML View**: Renderização com `window.callTool()` para acesso ao env (similar a células JavaScript)
- **Atalhos**: "/" abre menu, "@" insere menções, templates funcionando

### 10) Novidades da AI SDK 5 implementadas:

- **Streaming nativo**: `streamText` + `useChat` com `onToolCall` em tempo real
- **Controle de loop**: `stopWhen` com `stepCountIs()` e `hasToolCall()`
- **Tool calling nativo**: `tool()` helper com parameters/execute
- **Rota dedicada**: `/stream` ao invés de tool RPC (suporta streaming)
- **Anthropic provider**: Configurado via `env.ANTHROPIC_API_KEY`
- **HTML env access**: Scripts HTML podem chamar `window.callTool()` para usar workspace tools


