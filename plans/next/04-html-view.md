# 4) Create HTML View (with Environment Access)

**Objective:** Render HTML content within a cell, with capability to execute scripts that access `env` tools (similar to JavaScript cells).

**Deliverables:**
- New `HtmlView` component with sanitization and `env` global injection
- Registration in view catalog and Notebook support
- HTML script execution system with tool access

---

## Technical Steps:

### 1. HtmlView Component with Env Injection:
```typescript
// view/src/components/Views/HtmlView.tsx
export function HtmlView({ cell, onContentChange, isFullscreen, notebook }: ViewProps) {
  const [processedHtml, setProcessedHtml] = useState('');
  
  useEffect(() => {
    // Create global env similar to JavaScript execution
    const env = createExecutionEnvironment(notebook);
    
    // Inject env as global in HTML
    const envScript = `
      <script>
        window.env = ${JSON.stringify(createSerializableEnv(env))};
        
        // Wrapper functions to maintain async/await
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
    
    // Sanitize HTML and inject env script
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

### 2. API Route for HTML Tool Calls:
```typescript
// server/main.ts (add route)
const handleRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/tool-call' && request.method === 'POST') {
    const { toolName, params } = await request.json();
    
    // Execute tool via existing TOOL_CALL
    const result = await client.TOOL_CALL({ toolName, params });
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // ... rest of handler
};
```

### 3. Env Serialization for HTML:
```typescript
// view/src/hooks/core/useNotebookExecution.ts (add)
const createSerializableEnv = (env: any) => {
  // Convert functions to references that will be called via fetch
  return {
    DATABASES: {
      RUN_SQL: '$$TOOL_CALL:DATABASES_RUN_SQL'
    },
    PROFILES: {
      GET: '$$TOOL_CALL:PROFILES_GET'
    },
    // ... other tools
  };
};
```

### 4. HTML Usage Example:
```html
<!-- Example HTML cell with env access -->
<div id="results"></div>
<button onclick="loadData()">Load Data</button>

<script>
  async function loadData() {
    try {
      const result = await window.callTool('DATABASES_RUN_SQL', {
        sql: 'SELECT * FROM users LIMIT 10'
      });
      
      document.getElementById('results').innerHTML = 
        '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
</script>
```

---

## File Changes:
- `view/src/components/Views/HtmlView.tsx` (new, with env injection)
- `view/src/utils/availableViews.ts` (register HTML view)
- `server/main.ts` (add `/api/tool-call` route)
- `view/src/hooks/core/useNotebookExecution.ts` (add `createSerializableEnv`)

## Packages:
- `dompurify`

## Acceptance Criteria:
- HTML renders securely (XSS mitigated)
- HTML scripts can call `window.callTool()` to access workspace tools
- Works similar to JavaScript cells but in HTML context

## Risks:
- XSS if sanitization fails; use `dompurify` rigorously
- Same-origin policy in iframe; configure sandbox appropriately
