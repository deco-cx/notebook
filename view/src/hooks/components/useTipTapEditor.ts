import { useMemo, useEffect, useRef } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
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
      const markdown = editor.storage.markdown.getMarkdown();
      onContentChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && cell.content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(cell.content);
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
