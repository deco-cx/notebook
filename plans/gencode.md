Há uma parte importante desse sistema para fecharmos: as chamadas de javascript devem sempre voltar um valor de resposta, que devemos capturar para adicionar no cell (e utilizar desse valor)

Hoje em dia, acho que não estamos capturando isso. Preciso que você complemente esse documento apos estudar o ssitema, o estado atual, e como fazemos essa implementacao 

Isso é útil, por exemplo, para trabalhos continuos onde um dado depende do outro 

Para isso funcionar, vamos precisar que, quando um step é um código javascript, o valor retornado quando ele é executado seja capturado e salvo dentro da cell no output

No env, deve haver um env.getCellOutput("cellId"). Each cell should have an auto generated id, 6 chars.

Precisamos, então, também fazer essa engine funcionar 

Quero também adicionar um parametro no cell de omitOutputToAi?: boolean. We should set this to true if output is very large (>6000 chars, configurable in the notebook outputMaxsize). Fácil de configurar.

Quero também garantir que estamos enviando todo o notebook para a AI quando pedimos pra RUN cell. Isso é necessário para a AI saber fazer codigo que se utiliza ou da informacao de outro step ou código que vai referenciar a informacao de outro step como variavel ou vai fazer uma tool call parecida com o que o outro step fez, a depender do pedido (inclua no nosso doc um ajuste prompt para contemplar isso)

\n
Plano de implementação (repo atual)

1) Tipos e configurações
- Adicionar no tipo `Cell` a flag opcional `omitOutputToAi?: boolean`.
- Adicionar no tipo `Notebook` uma configuração opcional `settings?: { outputMaxSize?: number }` com default 6000.
- Padronizar que o retorno de células JavaScript vira um output com `type: "json"` e `content` como JSON serializado do valor retornado.

Arquivos a editar:
- `view/src/types/notebook.ts`
  - Extender `Cell` e `Notebook` conforme acima.

2) IDs curtos (6 chars) para células
- Criar um util `genId(len = 6)` que gera IDs alfanuméricos.
- Substituir todos os lugares que criam `cell.id` para usar `genId(6)`.
- Locais:
  - `view/src/hooks/useNotebooks.ts` (células default e novas)
  - `view/src/components/Notebook/Notebook.tsx` (células geradas via AI em RUN_CELL e no menu "Add Cell")

Snippet util (exemplo):
```ts
// view/src/lib/utils.ts (ou arquivo existente utils)
export const genId = (len = 6) => Array.from(crypto.getRandomValues(new Uint8Array(len)))
  .map((b) => (b % 36).toString(36))
  .join("");
```

3) Engine de execução JS no frontend
- Hoje capturamos o valor retornado em `executeJavaScript` e escrevemos em `outputs`. Manter isso, mas:
  - Expor `env.getCellOutput(cellId: string)` no ambiente de execução para que JS de outras células leiam o último output JSON dessa célula.
  - Marcar `omitOutputToAi` automaticamente quando o tamanho do output exceder `notebook.settings?.outputMaxSize ?? 6000`.
- Estrutura do `getCellOutput`:
  - Procura a célula pelo `id` no `notebook` atual
  - Retorna `undefined` se não existir
  - Retorna o `content` do último item de `outputs` cujo `type` ∈ {"json","text","html"} (priorizar `json` se existir)

Arquivos a editar:
- `view/src/components/Notebook/Notebook.tsx`
  - Alterar `createExecutionEnvironment()` para receber `notebook` (e, se preferir, um `getNotebook()` para estado fresco) e incluir `getCellOutput` no objeto `env` raiz.
  - Após `const result = await func(wrappedEnv);`:
    - Persistir em `outputs` o valor retornado (já existe)
    - Calcular `const max = notebook.settings?.outputMaxSize ?? 6000;` e, se `JSON.stringify(result).length > max`, atualizar a célula com `omitOutputToAi: true`.

Exemplo de adição ao `env`:
```ts
const createExecutionEnvironment = (notebook: NotebookType) => ({
  getCellOutput: (cellId: string) => {
    const cell = notebook.cells.find((c) => c.id === cellId);
    if (!cell?.outputs?.length) return undefined;
    const json = [...cell.outputs].reverse().find((o) => o.type === "json");
    if (json) return json.content;
    const textOrHtml = [...cell.outputs].reverse().find((o) => o.type === "text" || o.type === "html");
    return textOrHtml?.content;
  },
  // ... integrações já existentes (DATABASES, TEAMS, etc.)
});
```

4) Ajustes no RUN_CELL (server) para enviar TODO o notebook
- Já enviamos `notebook.cells` no input do tool, mas o prompt considera hoje apenas o conteúdo do `cellToRun`. Ajustar o prompt para:
  - Incluir um resumo do notebook inteiro (tipo, conteúdo e, quando `omitOutputToAi !== true`, outputs truncados a `outputMaxSize`).
  - Instruir a IA a:
    1) Sempre gerar JS que retorne um valor (o último statement deve "return" o principal resultado)
    2) Usar `env.getCellOutput("<id>")` quando precisar reutilizar dados de outras células
    3) Evitar repetir markdown; quando a célula atual for markdown, gerar apenas código JS

Arquivos a editar:
- `server/tools/notebook.ts`
  - Atualizar a construção do `prompt` para algo como:

```ts
const max = 6000; // não precisa ser exato; aqui é só prompt-side
const notebookContext = context.notebook.cells.map((c, i) => ({
  idx: i,
  id: c.id ?? `idx_${i}`,
  type: c.type,
  content: c.content?.slice(0, 2000),
  outputs: c.omitOutputToAi ? undefined : (c.outputs?.map(o => ({
    type: o.type,
    content: ("" + o.content).slice(0, max)
  })) || undefined)
}));

const prompt = `Você é um gerador de células JavaScript para um Notebook.

CONTEXT0: NOTEBOOK COMPLETO (com outputs truncados quando necessário)
${JSON.stringify(notebookContext)}

CONTEXT1: CÉLULA ACIONADA
Index: ${context.cellToRun}
ID: ${context.notebook.cells[context.cellToRun]?.id}
Tipo: ${context.notebook.cells[context.cellToRun]?.type}
Conteúdo: ${context.notebook.cells[context.cellToRun]?.content}

REGRAS:
1. Se a célula acionada for markdown, gere APENAS uma nova célula JavaScript que execute a solicitação.
2. Sempre retorne um valor no final do código (isso será capturado como output da célula).
3. Para reutilizar dados de outras células, use env.getCellOutput("<id-da-celula>").
4. Para tools, use a sintaxe env.APP.TOOL(params) (exemplos abaixo).
5. Não repita conteúdo markdown em texto; implemente diretamente o que foi pedido.
`;
```
  - Manter `schema` atual (cellsToAdd), mas atualizar a descrição para reforçar o retorno de valor e o uso de `env.getCellOutput`.

5) Enriquecer o ambiente de execução com contagem de chamadas
- Já contamos `apiCalls`. Manter e, opcionalmente, expor `env.__stats = { apiCalls }` para debug.

6) UX/Observabilidade
- Exibir o `id` da célula na UI (pequeno badge ao lado do tipo) para facilitar referência no código.
- Quando `omitOutputToAi` estiver verdadeiro, indicar visualmente (ex.: badge "Output omitido para IA").

Arquivos a editar:
- `view/src/components/Cell/Cell.tsx` (exibir ID e badge)

7) Critérios de aceite
- Rodar uma célula JS com `return 1+1` deve salvar em `outputs[0] = { type: "json", content: 2 }` e permitir `env.getCellOutput(<id>)` retornar `2` a partir de outra célula.
- Quando o tamanho do `JSON.stringify(output)` exceder `outputMaxSize`, a célula deve ser atualizada com `omitOutputToAi: true`.
- Ao executar RUN em uma célula markdown que peça dados transformados a partir de outra célula, a IA deve gerar JS que use `env.getCellOutput("<id>")` no código.

8) Testes
- Manual:
  - Criar duas células: (1) JS que retorna um array grande; (2) JS que lê esse retorno via `env.getCellOutput("<id-da-1>")` e processa.
  - Verificar marcação automática de `omitOutputToAi` quando exceder 6000 chars.
  - Rodar markdown que peça "Filtrar os 10 primeiros elementos do output da célula <id>" e validar que o código gerado usa `env.getCellOutput`.
- Automatizável (futuro):
  - Extrair funções de env/exec para módulos testáveis e escrever unit tests para `getCellOutput`.

9) Observações importantes
- Segurança: continuamos executando JS do usuário no browser (`new Function`). Não injetar objetos de janela/documento no env. Mantemos apenas proxies de tools e utilidades controladas.
- Performance: truncar outputs no prompt (server) e evitar enviar outputs marcados com `omitOutputToAi`.

10) Lista de edits por arquivo (resumo)
- `view/src/types/notebook.ts`: adicionar `omitOutputToAi?: boolean` em `Cell`; `settings?: { outputMaxSize?: number }` em `Notebook`.
- `view/src/lib/utils.ts`: adicionar `genId` (ou reaproveitar util existente).
- `view/src/hooks/useNotebooks.ts`: usar `genId(6)` para IDs default/novas.
- `view/src/components/Notebook/Notebook.tsx`:
  - Passar `notebook` para `createExecutionEnvironment`.
  - Incluir `getCellOutput` no `env`.
  - Após execução JS, atualizar `outputs` e `omitOutputToAi` quando necessário com base em `outputMaxSize`.
  - Usar `genId(6)` para novas células (inclusive geradas pela IA).
- `view/src/components/Cell/Cell.tsx`: exibir ID e badge de omissão quando aplicável.
- `server/tools/notebook.ts`: ajustar `prompt` para incluir notebook completo (com outputs truncados) e instruções de `return` + `env.getCellOutput`.

11) Prompt (versão final a usar no server)
```text
Você é um gerador de código para células JavaScript dentro de um Notebook.

CONTEXT0: NOTEBOOK COMPLETO (cells com type, content e outputs, estes truncados e omitidos quando indicado)
<JSON do notebook, com outputs truncados e omitidos quando omitOutputToAi=true>

CONTEXT1: CÉLULA ACIONADA
- index e id da célula
- type e content

REGRAS:
1) Se a célula acionada for markdown, gere APENAS uma nova célula { type: "javascript", content: "..." }.
2) O código gerado DEVE terminar com um `return <valor>` representando o resultado principal.
3) Para reutilizar dados de outras células, chame `env.getCellOutput("<id>")`.
4) Para usar ferramentas, chame `env.APP.TOOL(params)` conforme exemplos fornecidos.
5) Não repita markdown em texto; implemente diretamente o pedido em JS.
```

12) Defaults sugeridos
- `Notebook.settings.outputMaxSize = 6000` quando ausente.
- Ao criar notebooks/células, popular `id` com `genId(6)`.

Com isso cobrimos: captura do retorno das células JS, acesso a outputs via `env.getCellOutput`, IDs de 6 chars, sinalização de outputs grandes com `omitOutputToAi`, e envio do notebook completo (com outputs truncados/omitidos) para a IA no RUN da célula.