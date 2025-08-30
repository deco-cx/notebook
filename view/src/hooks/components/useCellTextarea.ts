import { useRef, useEffect } from 'react';

export function useCellTextarea(content: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Auto-resize textarea when content changes
  useEffect(() => {
    autoResize();
  }, [content]);

  return {
    textareaRef,
    autoResize
  };
}
