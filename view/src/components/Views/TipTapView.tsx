
import { EditorContent } from '@tiptap/react';

import type { ViewProps } from '../../types/notebook';
import { useTipTapEditor } from '../../hooks';

export function TipTapView({ cell, onContentChange, isFullscreen, onExecute }: ViewProps) {
  const editorHook = useTipTapEditor(cell, onContentChange, onExecute);

  if (!editorHook.editor) {
    return <div className="text-gray-400 p-4">Loading editor...</div>;
  }

  return (
    <div className={`${isFullscreen ? 'h-screen p-8' : 'min-h-[200px]'}`}>
      {/* Toolbar - hidden for clean look, functionality available via keyboard */}
      <div className="hidden">{/* Toolbar buttons moved to keyboard shortcuts only */}</div>
      
      {/* Clean editor without visible toolbar */}
      <EditorContent 
        editor={editorHook.editor}
        className="prose prose-sm max-w-none focus:outline-none"
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          lineHeight: '1.6',
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          .prose .ProseMirror {
            outline: none;
            color: hsl(var(--foreground));
            min-height: ${isFullscreen ? '60vh' : '24px'};
          }
          
          .prose .ProseMirror h1 {
            color: hsl(var(--foreground));
            font-size: 1.5em;
            font-weight: 700;
            margin: 1em 0 0.5em 0;
          }
          
          .prose .ProseMirror h2 {
            color: hsl(var(--foreground));
            font-size: 1.3em;
            font-weight: 600;
            margin: 1em 0 0.5em 0;
          }
          
          .prose .ProseMirror h3 {
            color: hsl(var(--foreground));
            font-size: 1.1em;
            font-weight: 600;
            margin: 1em 0 0.5em 0;
          }
          
          .prose .ProseMirror p {
            margin: 0.5em 0;
            line-height: 1.6;
            color: hsl(var(--foreground));
          }
          
          .prose .ProseMirror ul {
            margin: 0.5em 0;
            padding-left: 1.5em;
          }
          
          .prose .ProseMirror li {
            margin: 0.25em 0;
            color: hsl(var(--foreground));
          }
          
          .prose .ProseMirror strong {
            font-weight: 600;
          }
          
          .prose .ProseMirror em {
            font-style: italic;
          }
          
          .prose .ProseMirror code {
            background: hsl(var(--muted));
            color: hsl(var(--muted-foreground));
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
          }
          
          .prose .ProseMirror pre {
            background: hsl(var(--muted));
            color: hsl(var(--foreground));
            padding: 1em;
            border-radius: 6px;
            border: 1px solid hsl(var(--border));
            overflow-x: auto;
            margin: 1em 0;
          }
        `
      }} />
    </div>
  );
}
