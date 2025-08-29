import { useMemo, useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Extension } from '@tiptap/core';
import type { Cell as CellInterface } from '../../types/notebook';

export function useTipTapEditor(
  cell: CellInterface, 
  onContentChange: (content: string) => void,
  onExecute?: () => void
) {
  // Keep onExecute stable inside extension to avoid re-creating the editor
  const execRef = useRef(onExecute);
  useEffect(() => { execRef.current = onExecute; }, [onExecute]);

  const RunShortcut = useMemo(() => (
    Extension.create({
      name: 'runShortcut',
      addKeyboardShortcuts() {
        return {
          'Mod-Enter': () => {
            if (execRef.current) execRef.current();
            return true;
          },
          'Shift-Enter': () => {
            if (execRef.current) execRef.current();
            return true;
          },
        };
      },
    })
  ), []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      RunShortcut,
    ],
    content: cell.content,
    onUpdate: ({ editor }) => {
      // Avoid feedback loop when we programmatically set content
      if ((editor as any)._applyingExternalContent) return;
      const markdown = editor.storage.markdown.getMarkdown();
      (editor as any)._lastMarkdown = markdown;
      onContentChange(markdown);
    },
  });

  // Keep editor content in sync only when external content changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    const last = (editor as any)._lastMarkdown as string | undefined;
    const next = cell.content ?? '';
    // If the incoming content differs from what the editor last produced, update
    if (next !== current && next !== last) {
      (editor as any)._applyingExternalContent = true;
      editor.commands.setContent(next);
      (editor as any)._lastMarkdown = next;
      // Allow TipTap to finish transaction before clearing the flag
      setTimeout(() => { (editor as any)._applyingExternalContent = false; }, 0);
    }
  }, [cell.content, editor]);

  // Formatting actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleHeading = (level: 1 | 2 | 3) => 
    editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();

  const insertContent = (content: string) => {
    editor?.chain().focus().insertContent(content).run();
  };

  const focus = () => editor?.chain().focus().run();

  const toggleEditable = () => {
    if (editor) {
      editor.setEditable(!editor.isEditable);
    }
  };

  // Get editor stats
  const wordCount = editor?.storage.characterCount?.words() || 0;
  const characterCount = editor?.storage.characterCount?.characters() || 0;

  return {
    // Editor instance
    editor,

    // State
    isEditable: editor?.isEditable ?? true,
    wordCount,
    characterCount,

    // Actions
    toggleEditable,
    insertContent,
    focus,

    // Formatting
    toggleBold,
    toggleItalic,
    toggleCode,
    toggleHeading,
    toggleBulletList,

    // Active states
    isBold: editor?.isActive('bold') ?? false,
    isItalic: editor?.isActive('italic') ?? false,
    isCode: editor?.isActive('code') ?? false,
    isHeading1: editor?.isActive('heading', { level: 1 }) ?? false,
    isHeading2: editor?.isActive('heading', { level: 2 }) ?? false,
    isHeading3: editor?.isActive('heading', { level: 3 }) ?? false,
    isBulletList: editor?.isActive('bulletList') ?? false,
  };
}
