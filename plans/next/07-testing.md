# 7) Testing and QA

## Testing Strategy:

### Authentication Flow Testing:
- **OAuth Integration**: Test login/logout flow with deco.chat
- **Auth Modal**: Verify modal appears for AI features when logged out
- **Workspace Display**: Confirm workspace name and email display correctly
- **Permission Handling**: Test access to workspace tools after login

### Agent and Tool Calls Testing:
- **RPC Mocks**: Create mocks for RPC calls in test environment
- **Error Scenarios**: Test timeout handling, network failures, AI quota limits
- **Tool Execution**: Verify tool calls execute correctly and update notebook
- **Streaming**: Test real-time message streaming and tool invocation display

### HTML View Security Testing:
- **XSS Prevention**: Test with malicious payloads to verify DOMPurify sanitization
- **Script Execution**: Verify `window.callTool()` works correctly
- **Sandbox Security**: Test iframe sandbox restrictions
- **Tool Access**: Confirm HTML scripts can access workspace tools safely

### Database Operations Testing:
- **CRUD Operations**: Test create, read, update, delete for notebooks
- **Pagination**: Verify pagination works with large notebook lists
- **Search Functionality**: Test search across notebook titles, content, tags
- **Daily Note Creation**: Test auto-creation of daily notes
- **Migration Testing**: Verify database migrations apply correctly

### Navigation and Shortcuts Testing:
- **Keyboard Shortcuts**: Test Cmd+N for new note creation
- **Note Selection**: Test note selector search and filtering
- **URL Routing**: Test direct notebook URLs and redirects
- **Slash Commands**: Test "/" menu appears and executes actions
- **Mentions**: Test "@" variable completion and insertion

---

## QA Checklist:

### Onboarding Experience:
- [ ] Logged-out users see welcome notebook
- [ ] JavaScript example runs without login
- [ ] AI features trigger auth modal
- [ ] Modal explains deco app and free credits
- [ ] Login flow works end-to-end

### Authentication:
- [ ] Login button appears for logged-out users
- [ ] Workspace info displays for logged-in users
- [ ] Logout clears session and redirects
- [ ] Auth state persists across page refreshes

### Database Persistence:
- [ ] Notebooks save and load correctly
- [ ] Pagination works with large datasets
- [ ] Search returns relevant results
- [ ] Daily notes auto-create with proper template
- [ ] User isolation works (users only see own notes)

### Note Navigation:
- [ ] Note selector shows grouped lists
- [ ] Search filters notebooks correctly
- [ ] Cmd+N creates new note
- [ ] URL routing works for direct notebook access
- [ ] Daily note redirect works from root URL

### Agent Functionality:
- [ ] Chat interface opens and closes properly
- [ ] Messages stream in real-time
- [ ] Tool calls execute and modify notebook
- [ ] Error messages display clearly
- [ ] Chat history persists during session

### HTML View:
- [ ] HTML renders safely in iframe
- [ ] Scripts can call workspace tools
- [ ] XSS attempts are blocked
- [ ] Interactive elements work correctly

### Shortcuts and Templates:
- [ ] "/" opens command menu
- [ ] Menu items execute correctly
- [ ] "@" shows variable suggestions
- [ ] Templates insert multiple cells
- [ ] Keyboard navigation works in menus

---

## Performance Testing:

### Load Testing:
- Test with 100+ notebooks in list
- Test with notebooks containing 50+ cells
- Test rapid cell creation/deletion
- Test concurrent user sessions

### Memory Testing:
- Monitor memory usage during long sessions
- Test for memory leaks in chat interface
- Verify proper cleanup of event listeners
- Test iframe memory management

### Network Testing:
- Test with slow network connections
- Verify graceful degradation for offline scenarios
- Test timeout handling for long-running operations
- Verify proper loading states throughout app

---

## Browser Compatibility:

### Desktop Browsers:
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)  
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### Mobile Browsers:
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet

### Keyboard Shortcuts:
- [ ] Test Cmd+N on macOS
- [ ] Test Ctrl+N on Windows/Linux
- [ ] Verify shortcuts don't conflict with browser shortcuts

---

## Security Testing:

### XSS Prevention:
- Test HTML cell with `<script>alert('xss')</script>`
- Test markdown with embedded HTML/JavaScript
- Verify DOMPurify configuration blocks malicious content
- Test iframe sandbox restrictions

### Authentication Security:
- Verify OAuth tokens are handled securely
- Test session timeout handling
- Verify workspace isolation
- Test unauthorized access attempts

### Database Security:
- Test SQL injection attempts in search
- Verify user data isolation
- Test permission boundaries
- Verify sensitive data is not logged
