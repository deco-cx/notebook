import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Extension } from '@tiptap/core';
import { Bold, Italic, List, Heading1, Heading2, Heading3 } from 'lucide-react';
import type { ViewProps } from '../../types/notebook';

export function TipTapView({ cell, onContentChange, isFullscreen, onExecute }: ViewProps) {
  const RunShortcut = React.useMemo(() => (
    Extension.create({
      name: 'runShortcut',
      addKeyboardShortcuts() {
        return {
          'Mod-Enter': () => {
            if (onExecute) onExecute();
            return true;
          },
          'Shift-Enter': () => {
            if (onExecute) onExecute();
            return true;
          },
        };
      },
    })
  ), [onExecute]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      RunShortcut,
    ],
    content: cell.content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onContentChange(markdown);
    },
  });

  React.useEffect(() => {
    if (editor && cell.content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(cell.content);
    }
  }, [cell.content, editor]);

  if (!editor) {
    return <div className="text-gray-400 p-4">Loading editor...</div>;
  }

  return (
    <div className={`tiptap-view ${isFullscreen ? 'h-screen p-8' : 'min-h-[200px]'}`}>
      {/* Toolbar */}
      <div className="tiptap-toolbar flex gap-1 mb-4 p-2 bg-gray-700 rounded border border-gray-600">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('bold') 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('italic') 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px bg-gray-600 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 1 }) 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 3 }) 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
        <div className="w-px bg-gray-600 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded text-sm transition-colors ${
            editor.isActive('bulletList') 
              ? 'bg-orange-500 text-black' 
              : 'text-gray-300 hover:bg-gray-600'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor}
        className="tiptap-content prose prose-invert max-w-none bg-gray-900 rounded border border-gray-600 p-4 focus-within:border-orange-500 transition-colors"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
        }}
      />

      <style jsx global>{`
        .tiptap-content .ProseMirror {
          outline: none;
          color: #f0f0f0;
          min-height: ${isFullscreen ? '60vh' : '150px'};
        }
        
        .tiptap-content .ProseMirror h1 {
          color: #ff6b35;
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .tiptap-content .ProseMirror h2 {
          color: #ff6b35;
          font-size: 1.3em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .tiptap-content .ProseMirror h3 {
          color: #ff6b35;
          font-size: 1.1em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }
        
        .tiptap-content .ProseMirror p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        
        .tiptap-content .ProseMirror ul {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        
        .tiptap-content .ProseMirror li {
          margin: 0.25em 0;
          color: #f0f0f0;
        }
        
        .tiptap-content .ProseMirror strong {
          color: #00ff41;
          font-weight: bold;
        }
        
        .tiptap-content .ProseMirror em {
          color: #ffff00;
          font-style: italic;
        }
        
        .tiptap-content .ProseMirror code {
          background: #2d2d2d;
          color: #00ff41;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: var(--font-mono);
        }
        
        .tiptap-content .ProseMirror pre {
          background: #1a1a1a;
          color: #f0f0f0;
          padding: 1em;
          border-radius: 6px;
          border: 1px solid #ff6b35;
          overflow-x: auto;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
}
