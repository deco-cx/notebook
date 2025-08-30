# 8) Commands and Dependencies

## Installation Commands:

### Server (AI SDK 5):
```bash
cd server
npm i ai @ai-sdk/anthropic zod-to-json-schema
```

### Frontend (AI SDK 5 + other features):
```bash
cd view
npm i ai @ai-sdk/react dompurify @tiptap/suggestion @tiptap/extension-mention
```

### Database Migrations:
```bash
# After updating server/schema.ts
npm run db:generate
```

---

## Configuration:

### Anthropic API Key Configuration:
```bash
# In server/wrangler.toml:
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."
```

### Environment Variables:
```typescript
// server/main.ts
export interface Env {
  ANTHROPIC_API_KEY: string;
  // ... other vars
}
```

---

## Development Commands:

### Build/Dev:
```bash
npm run dev
```

### Type Generation:
```bash
# After adding new integrations in deco.chat
npm run gen

# Self-type generation (after new tools/workflows on running server):
DECO_SELF_URL=<dev-url-with-/mcp> npm run gen:self
```

### Database Operations:
```bash
# Generate migration after schema changes
npm run db:generate

# Migrations apply automatically when using getDb(env)
```

---

## Deployment Process:

### 1. Pre-deployment Checklist:
- [ ] All tests passing
- [ ] Database migrations generated
- [ ] Environment variables configured
- [ ] API keys set in wrangler.toml
- [ ] Frontend builds successfully

### 2. Deploy to Production:
```bash
npm run deploy
```

### 3. Post-deployment Verification:
- [ ] App accessible at public URL
- [ ] OAuth flow works with production domain
- [ ] Database operations function correctly
- [ ] AI features work with configured API keys
- [ ] All integrations accessible

---

## Environment Setup:

### Prerequisites:
- Node.js >=18.0.0
- npm >=8.0.0
- Deno >=2.0.0
- Deco CLI: `deno install -Ar -g -n deco jsr:@deco/cli`

### Initial Setup:
```bash
# Authenticate with deco.chat
deco login

# Install dependencies
npm install

# Configure app
npm run configure

# Start development
npm run dev
```

---

## Production Configuration:

### Wrangler Configuration:
```toml
# server/wrangler.toml
main = "main.ts"
compatibility_date = "2025-06-17"
compatibility_flags = [ "nodejs_compat" ]

[deco]
app = "deco-studio"
workspace = "your-workspace"
enable_workflows = true

[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-..."

[[deco.bindings]]
name = "DECO_CHAT_WORKSPACE_API"
type = "mcp"
integration_id = "workspace-api"

[durable_objects]
[[durable_objects.bindings]]
name = "DECO_CHAT_WORKFLOW_DO"
class_name = "Workflow"
```

### Package.json Scripts:
```json
{
  "scripts": {
    "dev": "deco dev",
    "deploy": "wrangler deploy --dry-run --outdir dist && cd dist && deco deploy",
    "gen": "deco gen",
    "gen:self": "deco gen:self",
    "db:generate": "drizzle-kit generate"
  }
}
```

---

## Monitoring and Debugging:

### Development Debugging:
```bash
# Start with debugging
deco dev --debug

# Check logs
deco logs

# Test specific workflow
deco test workflow-name
```

### Production Monitoring:
- Monitor Cloudflare Workers analytics
- Track AI API usage and costs
- Monitor database performance
- Set up error alerting

### Common Issues:
1. **Type Errors**: Check Zod schemas and TypeScript types
2. **Integration Errors**: Verify integration configuration and credentials
3. **Workflow Errors**: Check step dependencies and data flow
4. **Deployment Errors**: Verify wrangler.toml configuration
5. **Database Errors**: Check schema migrations and connection

---

## Performance Optimization:

### Frontend:
- Use React Query for efficient caching
- Implement virtual scrolling for large notebook lists
- Lazy load heavy components (Monaco editor, Excalidraw)
- Optimize bundle size with code splitting

### Backend:
- Cache dynamic tool discovery results
- Use database indexes for common queries
- Implement request rate limiting
- Optimize SQL queries with proper joins

### Database:
- Index frequently queried columns
- Use pagination for large result sets
- Implement soft deletes for better performance
- Regular database maintenance and optimization
