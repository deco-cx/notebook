# 1) Make App Installable with Complete Onboarding Experience

**Objective:** Create a complete onboarding experience for both logged-out and logged-in users, with persistent data storage and note navigation system.

**Deliverables:**
- Default onboarding notebook for logged-out users
- Authentication modal with deco login explanation  
- OAuth flow integration with workspace display
- SQLite database persistence with Drizzle ORM
- Complete CRUD tools for notebooks with pagination
- Note navigation system in topbar
- Daily note auto-creation and URL routing

---

## 1.1) Default Onboarding Experience (Logged-out Users)

**Goal:** Allow users to see and interact with the app before logging in, with a guided onboarding notebook.

**Technical Steps:**

1. **Create default onboarding notebook structure:**
   ```typescript
   // view/src/utils/defaultNotebook.ts
   export const createOnboardingNotebook = () => ({
     id: 'onboarding',
     title: 'Welcome to Deco Studio',
     cells: [
       {
         id: 'welcome-1',
         type: 'markdown',
         content: `# Welcome to Deco Studio 🎉

   Deco Studio is a powerful notebook environment that connects to your deco.chat workspace, allowing you to:

   - **Execute code** in multiple languages (JavaScript, Python, SQL)
   - **Access your workspace tools** directly from notebook cells
   - **Generate content with AI** using your workspace integrations
   - **Create interactive dashboards** with HTML and visualizations
   - **Collaborate** with AI agents that understand your notebook context

   This is a **deco app** - it integrates seamlessly with your deco.chat workspace to provide a rich development environment.`,
         selectedView: 'tiptap',
         status: 'idle',
         outputs: []
       },
       {
         id: 'welcome-2', 
         type: 'javascript',
         content: `// Let's start with a simple example
   // Click the Run button (▶️) in the top-right to execute this cell

   const greeting = "Hello from Deco Studio!";
   const features = [
     "Multi-language code execution",
     "Workspace tool integration", 
     "AI-powered content generation",
     "Interactive visualizations"
   ];

   console.log(greeting);
   console.log("Key features:");
   features.forEach((feature, index) => {
     console.log(\`\${index + 1}. \${feature}\`);
   });

   return {
     message: greeting,
     featuresCount: features.length,
     timestamp: new Date().toISOString()
   };`,
         selectedView: 'monaco',
         status: 'idle',
         outputs: []
       },
       {
         id: 'welcome-3',
         type: 'markdown', 
         content: `## Try AI-Powered Code Generation

   Now let's see the real power of Deco Studio. The cell below will use AI to generate code that calls one of our example tools.

   **Click the Run button (▶️)** on the next cell to see AI generate code that lists your notes using the \`LIST_NOTES\` tool.

   > **Note:** This will require login to access AI features. Don't worry - if you're a first-time deco.chat user, you get **$2 in free credits** to test the platform!`,
         selectedView: 'tiptap',
         status: 'idle', 
         outputs: []
       },
       {
         id: 'welcome-4',
         type: 'javascript',
         content: `// AI will generate code here that uses the LIST_NOTES tool
   // This demonstrates how notebooks can interact with your workspace tools

   const prompt = \`Generate JavaScript code that:
   1. Calls the LIST_NOTES tool to get all user notes
   2. Displays the results in a formatted way
   3. Shows the total count of notes
   4. Returns useful information about the notes\`;

   // This cell will be populated by AI when you click Run
   return { 
     instruction: "Click Run to generate AI-powered code",
     willUse: "LIST_NOTES tool from your workspace"
   };`,
         selectedView: 'monaco',
         status: 'idle',
         outputs: []
       }
     ],
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString()
   });
   ```

## 1.2) Authentication Modal for AI Features

**Goal:** Show authentication modal when users try to use AI features while logged out.

1. **Create authentication modal component:**
   ```typescript
   // view/src/components/auth/AuthModal.tsx
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
   import { Button } from '../ui/button';
   import { Sparkles, CreditCard, Zap } from 'lucide-react';

   interface AuthModalProps {
     isOpen: boolean;
     onClose: () => void;
     feature: string;
   }

   export function AuthModal({ isOpen, onClose, feature }: AuthModalProps) {
     const handleLogin = () => {
       window.location.href = '/oauth/start';
     };

     return (
       <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-blue-500" />
               Login with Deco to Use AI
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             <div className="text-center">
               <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                 <Zap className="h-8 w-8 text-white" />
               </div>
               
               <h3 className="font-semibold mb-2">This is a Deco App</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Connect to your deco.chat workspace to unlock AI features like {feature}.
               </p>
               
               <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                 <div className="flex items-center gap-2 text-green-700">
                   <CreditCard className="h-4 w-4" />
                   <span className="text-sm font-medium">First-time users get $2 free credits!</span>
                 </div>
                 <p className="text-xs text-green-600 mt-1">
                   Perfect for testing AI features and exploring the platform.
                 </p>
               </div>
             </div>

             <div className="space-y-2">
               <Button onClick={handleLogin} className="w-full" size="lg">
                 Login with Deco
               </Button>
               <Button variant="ghost" onClick={onClose} className="w-full">
                 Continue Without AI
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. **Create auth modal hook:**
   ```typescript
   // view/src/hooks/useAuthModal.ts
   import { useState, useCallback } from 'react';
   import { useAuth } from './useAuth';

   export function useAuthModal() {
     const [isOpen, setIsOpen] = useState(false);
     const [feature, setFeature] = useState('');
     const { isLoggedIn } = useAuth();

     const requireAuth = useCallback((featureName: string): boolean => {
       if (!isLoggedIn) {
         setFeature(featureName);
         setIsOpen(true);
         return false;
       }
       return true;
     }, [isLoggedIn]);

     const closeModal = useCallback(() => {
       setIsOpen(false);
       setFeature('');
     }, []);

     return {
       isOpen,
       feature,
       requireAuth,
       closeModal
     };
   }
   ```

## 1.3) Enhanced Authentication UI in Topbar

**Goal:** Show login button for logged-out users, workspace info for logged-in users.

1. **Update user button to show workspace info when logged in:**
   ```typescript
   // view/src/components/user-button.tsx (enhance existing)
   export function UserButton() {
     const { user, workspace, isLoggedIn, logout } = useAuth();

     if (!isLoggedIn) {
       return (
         <Button variant="ghost" size="sm" className="h-8 px-3" asChild>
           <a href="/oauth/start" className="flex items-center gap-2">
             <LogIn className="h-4 w-4" />
             <span className="hidden sm:inline">Login</span>
           </a>
         </Button>
       );
     }

     return (
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="h-auto p-2 flex flex-col items-start">
             <div className="flex items-center gap-2">
               <Avatar className="h-6 w-6">
                 <AvatarFallback className="text-xs">
                   {workspace?.name?.charAt(0)?.toUpperCase() || 'W'}
                 </AvatarFallback>
               </Avatar>
               <span className="font-medium text-sm">{workspace?.name || 'Workspace'}</span>
             </div>
             <span className="text-xs text-muted-foreground">{user?.email}</span>
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start">
           <DropdownMenuItem disabled>
             <Building className="h-4 w-4 mr-2" />
             {workspace?.name || 'Unknown Workspace'}
           </DropdownMenuItem>
           <DropdownMenuItem disabled>
             <User className="h-4 w-4 mr-2" />
             {user?.email || 'Unknown User'}
           </DropdownMenuItem>
           <DropdownMenuSeparator />
           <DropdownMenuItem onClick={logout}>
             <LogOut className="h-4 w-4 mr-2" />
             Logout
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
     );
   }
   ```

2. **Create auth context and hooks:**
   ```typescript
   // view/src/hooks/useAuth.ts (new file)
   import { createContext, useContext, useState, useEffect } from 'react';
   import { useQuery } from '@tanstack/react-query';
   import { client } from '../lib/rpc';

   interface AuthContextType {
     user: { id: string; email: string; name?: string } | null;
     workspace: { id: string; name: string } | null;
     isLoggedIn: boolean;
     isLoading: boolean;
     login: () => void;
     logout: () => void;
   }

   const AuthContext = createContext<AuthContextType | null>(null);

   export function AuthProvider({ children }) {
     const { data: authData, isLoading } = useQuery({
       queryKey: ['auth', 'status'],
       queryFn: () => client.GET_AUTH_STATUS(),
       retry: false,
       staleTime: 5 * 60 * 1000,
     });

     const login = () => window.location.href = '/oauth/start';
     const logout = () => {
       localStorage.clear();
       window.location.href = '/oauth/logout';
     };

     return (
       <AuthContext.Provider value={{
         user: authData?.user || null,
         workspace: authData?.workspace || null,
         isLoggedIn: !!authData?.user,
         isLoading,
         login,
         logout
       }}>
         {children}
       </AuthContext.Provider>
     );
   }

   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) throw new Error('useAuth must be used within AuthProvider');
     return context;
   };
   ```

## 1.4) Database Persistence with SQLite + Drizzle

**Goal:** Implement proper data persistence using the existing SQLite database.

1. **Update Drizzle schema for notebooks:**
   ```typescript
   // server/schema.ts (add to existing)
   export const notebooksTable = sqliteTable("notebooks", {
     id: text("id").primaryKey(),
     title: text("title").notNull(),
     content: text("content").notNull(), // JSON stringified cells
     userId: text("user_id"),
     workspaceId: text("workspace_id"),
     isTemplate: integer("is_template").default(0),
     isPublic: integer("is_public").default(0),
     createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
     updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
     lastAccessedAt: integer("last_accessed_at", { mode: 'timestamp' }),
     tags: text("tags"), // JSON array
     description: text("description"),
   }, (table) => ({
     userIdIndex: index("notebooks_user_id_idx").on(table.userId),
     workspaceIdIndex: index("notebooks_workspace_id_idx").on(table.workspaceId),
     createdAtIndex: index("notebooks_created_at_idx").on(table.createdAt),
   }));
   ```

2. **Create comprehensive notebook CRUD tools:**
   ```typescript
   // server/tools/notebooks.ts (new file)
   export const createSaveNotebookTool = (env: Env) => createTool({
     id: "SAVE_NOTEBOOK",
     description: "Save or update a notebook to the database",
     inputSchema: z.object({
       notebook: z.object({
         id: z.string(),
         title: z.string(),
         cells: z.array(z.any()),
         tags: z.array(z.string()).default([]),
         description: z.string().optional()
       }),
       userId: z.string().optional(),
       workspaceId: z.string().optional()
     }),
     outputSchema: z.object({
       success: z.boolean(),
       notebookId: z.string(),
       message: z.string()
     }),
     execute: async ({ context }) => {
       const db = await getDb(env);
       // Full implementation with upsert logic
     }
   });

   export const createListNotebooksTool = (env: Env) => createTool({
     id: "LIST_NOTEBOOKS",
     description: "List notebooks with pagination and filtering",
     inputSchema: z.object({
       userId: z.string().optional(),
       workspaceId: z.string().optional(),
       page: z.number().default(0),
       limit: z.number().default(20),
       search: z.string().optional(),
       includePublic: z.boolean().default(true)
     }),
     outputSchema: z.object({
       notebooks: z.array(z.object({
         id: z.string(),
         title: z.string(),
         cellCount: z.number(),
         tags: z.array(z.string()),
         updatedAt: z.string()
       })),
       pagination: z.object({
         total: z.number(),
         hasMore: z.boolean()
       })
     }),
     execute: async ({ context }) => {
       const db = await getDb(env);
       // Full implementation with filtering and pagination
     }
   });

   export const createGetOrCreateDailyNoteTool = (env: Env) => createTool({
     id: "GET_OR_CREATE_DAILY_NOTE",
     description: "Get or create today's daily note",
     inputSchema: z.object({
       userId: z.string().optional(),
       workspaceId: z.string().optional()
     }),
     outputSchema: z.object({
       notebook: z.object({
         id: z.string(),
         title: z.string(),
         cells: z.array(z.any())
       }),
       created: z.boolean()
     }),
     execute: async ({ context }) => {
       const db = await getDb(env);
       const today = new Date().toISOString().split('T')[0];
       const dailyNoteId = `daily-${today}${context.userId ? `-${context.userId}` : ''}`;
       
       // Check if exists, create daily note template if not
     }
   });

   export const notebookTools = [
     createSaveNotebookTool,
     createListNotebooksTool,
     createGetOrCreateDailyNoteTool
   ];
   ```

3. **Create auth status tool:**
   ```typescript
   // server/tools/auth.ts (new file)
   export const createGetAuthStatusTool = (env: Env) => createTool({
     id: "GET_AUTH_STATUS",
     description: "Get current authentication status and user info",
     inputSchema: z.object({}),
     outputSchema: z.object({
       user: z.object({
         id: z.string(),
         email: z.string(),
         name: z.string().optional()
       }).optional(),
       workspace: z.object({
         id: z.string(),
         name: z.string()
       }).optional(),
       isLoggedIn: z.boolean()
     }),
     execute: async () => {
       try {
         const profile = await env.DECO_CHAT_WORKSPACE_API.PROFILES_GET({});
         
         if (profile.email) {
           const workspaceInfo = await env.DECO_CHAT_WORKSPACE_API.WORKSPACE_GET({});
           
           return {
             user: {
               id: profile.id || profile.email,
               email: profile.email,
               name: profile.name
             },
             workspace: {
               id: workspaceInfo.id || 'unknown',
               name: workspaceInfo.name || 'Unknown Workspace'
             },
             isLoggedIn: true
           };
         }
       } catch (error) {
         console.log("Auth check failed:", error.message);
       }

       return { isLoggedIn: false };
     }
   });

   export const authTools = [createGetAuthStatusTool];
   ```

## 1.5) Note Navigation Component

**Goal:** Complete note navigation in topbar with search, grouping, and shortcuts.

1. **Create note selector component:**
   ```typescript
   // view/src/components/navigation/NoteSelector.tsx
   export function NoteSelector({ currentNotebook, onSelectNotebook, onCreateNote }) {
     const [isOpen, setIsOpen] = useState(false);
     const [search, setSearch] = useState('');
     
     // Cmd+N keyboard shortcut
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
           e.preventDefault();
           onCreateNote();
         }
       };
       document.addEventListener('keydown', handleKeyDown);
       return () => document.removeEventListener('keydown', handleKeyDown);
     }, [onCreateNote]);

     return (
       <div className="flex items-center gap-2">
         <Popover open={isOpen} onOpenChange={setIsOpen}>
           <PopoverTrigger asChild>
             <Button variant="ghost" className="h-8 px-3">
               <FileText className="h-4 w-4 mr-2" />
               <span className="max-w-[200px] truncate">
                 {currentNotebook?.title || 'Select Note'}
               </span>
               <Search className="h-3 w-3 ml-2 opacity-50" />
             </Button>
           </PopoverTrigger>
           
           <PopoverContent className="w-80 p-0">
             {/* Search input + grouped notebook lists */}
             {/* Daily Notes, Regular Notes, Templates sections */}
           </PopoverContent>
         </Popover>

         <Button 
           variant="ghost" 
           size="icon" 
           className="h-8 w-8"
           onClick={onCreateNote}
           title="Create New Note (⌘N)"
         >
           <Plus className="h-4 w-4" />
         </Button>
       </div>
     );
   }
   ```

2. **Update site header integration:**
   ```typescript
   // view/src/components/site-header.tsx (update existing)
   export function SiteHeader({ currentNotebook, onNotebookChange, onCreateNote }) {
     return (
       <header className="border-b bg-background/95 backdrop-blur">
         <div className="container flex h-14 items-center">
           {/* Logo */}
           <div className="mr-4 hidden md:flex">
             <Link to="/" className="mr-6 flex items-center space-x-2">
               <div className="h-6 w-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded" />
               <span className="hidden font-bold sm:inline-block">Deco Studio</span>
             </Link>
           </div>

           {/* Left side: User/Workspace + Note Navigation */}
           <div className="flex items-center gap-4">
             <UserButton /> {/* Shows workspace name + email when logged in */}
             
             <NoteSelector
               currentNotebook={currentNotebook}
               onSelectNotebook={onNotebookChange}
               onCreateNote={onCreateNote}
             />
           </div>

           {/* Right side: Chat + Run */}
           <div className="flex flex-1 items-center justify-end space-x-2">
             {/* Remove old green "New Note" button */}
             
             <Button variant="ghost" size="icon" className="h-9 w-9">
               <MessageCircle className="h-[18px] w-[18px]" />
             </Button>
             
             <Button size="sm" className="gap-2">
               <Play className="h-4 w-4" />
               Run
             </Button>
           </div>
         </div>
       </header>
     );
   }
   ```

## 1.6) URL Routing and Daily Note System

**Goal:** Implement proper URL routing with daily note defaults and notebook navigation.

1. **Create notebook routing:**
   ```typescript
   // view/src/routes/notebook.tsx (new route)
   import { createRoute } from "@tanstack/react-router";
   import { useGetNotebook, useGetOrCreateDailyNote } from '../hooks/useNotebooks';

   function NotebookRoute() {
     const { notebookId } = Route.useParams();
     const { user, workspace } = useAuth();
     const navigate = useNavigate();

     const { data: notebookData } = useGetNotebook(notebookId, user?.id);
     const { data: dailyNoteData } = useGetOrCreateDailyNote();

     useEffect(() => {
       // Redirect to daily note if no specific notebook
       if (!notebookId && dailyNoteData?.notebook) {
         navigate({ 
           to: '/notebook/$notebookId', 
           params: { notebookId: dailyNoteData.notebook.id },
           replace: true 
         });
       }
     }, [notebookId, dailyNoteData, navigate]);

     const notebook = notebookData?.notebook || dailyNoteData?.notebook;

     if (!notebook) return <div>Loading...</div>;

     return <NotebookComponent notebook={notebook} />;
   }

   export const Route = createRoute({
     getParentRoute: () => rootRoute,
     path: '/notebook/$notebookId',
     component: NotebookRoute,
   });
   ```

---

## Complete Implementation Summary

**New Files (8):**
- `view/src/utils/defaultNotebook.ts` - Onboarding notebook with welcome content
- `view/src/components/auth/AuthModal.tsx` - Login modal with deco explanation  
- `view/src/components/navigation/NoteSelector.tsx` - Note navigation with search
- `view/src/hooks/useAuthModal.ts` - Auth modal state management
- `view/src/hooks/useAuth.ts` - Authentication context and hooks
- `view/src/routes/notebook.tsx` - Notebook URL routing
- `server/tools/notebooks.ts` - Complete notebook CRUD with pagination
- `server/tools/auth.ts` - Authentication status checking

**Modified Files (6):**
- `server/schema.ts` - Add notebooks table with indexes
- `server/tools/index.ts` - Include notebook and auth tools
- `server/main.ts` - Register new tools in withRuntime
- `view/src/components/site-header.tsx` - Integrate note selector, remove old "New Note" button
- `view/src/components/user-button.tsx` - Show workspace name + email when logged in
- `view/src/main.tsx` - Add AuthProvider and new routes

**Key Features Implemented:**
- **Onboarding Experience:** Welcome notebook with runnable examples for logged-out users
- **Authentication Flow:** Modal explaining deco app + $2 free credits, seamless OAuth
- **Database Persistence:** Complete SQLite schema with Drizzle ORM, CRUD operations, pagination
- **Note Navigation:** Searchable note selector in topbar, daily note auto-creation, Cmd+N shortcut
- **User Experience:** Workspace display in topbar, grouped note lists, proper URL routing

**Acceptance Criteria:**
- ✅ Logged-out users see onboarding notebook with executable JavaScript example
- ✅ AI features trigger auth modal explaining deco app and free credits
- ✅ Login button in topbar, workspace info display when logged in  
- ✅ Note selector with search, daily notes, and Cmd+N shortcut
- ✅ Daily note auto-creation and URL routing
- ✅ Complete database persistence with proper migrations

**Risks:**
- Database migration complexity - mitigate with careful schema design and testing
- Authentication state synchronization - handle with proper React Query cache invalidation  
- URL routing complexity - use TanStack Router's type-safe patterns
- Performance with large notebook lists - implement proper pagination and virtual scrolling
