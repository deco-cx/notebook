/**
 * Default onboarding notebook for new users.
 * 
 * This creates a welcome notebook that introduces users to Notebook features
 * and provides runnable examples to demonstrate the platform capabilities.
 */

export const createOnboardingNotebook = () => ({
  id: 'onboarding',
  title: 'Welcome to Notebook',
  cells: [
    {
      id: 'welcome-1',
      type: 'markdown',
      content: `# Welcome to Notebook 🎉

Notebook is a powerful notebook environment that connects to your deco.chat workspace, allowing you to:

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

const greeting = "Hello from Notebook!";
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

Now let's see the real power of Notebook. The cell below will use AI to generate code that calls one of our example tools.

**Click the Run button (▶️)** on the next cell to see AI generate code that lists your notes using the \`LIST_NOTEBOOKS\` tool.

> **Note:** This will require login to access AI features. Don't worry - if you're a first-time deco.chat user, you get **$2 in free credits** to test the platform!`,
      selectedView: 'tiptap',
      status: 'idle', 
      outputs: []
    },
    {
      id: 'welcome-4',
      type: 'markdown',
      content: `Generate JavaScript code that:
1. Calls the LIST_NOTEBOOKS tool to get all user notes
2. Displays the results in a formatted way
3. Shows the total count of notes
4. Returns useful information about the notes

This cell will be populated by AI when you click Run above.`,
      selectedView: 'tiptap',
      status: 'idle',
      outputs: []
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

