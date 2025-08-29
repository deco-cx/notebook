import React from 'react';
import Editor from '@monaco-editor/react';
import type { ViewProps, CellType } from '../../types/notebook';

export function MonacoView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const getLanguage = (cellType: CellType): string => {
    switch (cellType) {
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'excalidraw': return 'json';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    onContentChange(value || '');
  };

  return (
    <div className={`monaco-view ${isFullscreen ? 'h-screen' : 'h-64'} border border-gray-600 rounded overflow-hidden`}>
      <Editor
        height="100%"
        language={getLanguage(cell.type)}
        value={cell.content}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: isFullscreen },
          fontSize: 14,
          fontFamily: 'Fira Code, JetBrains Mono, Consolas, monospace',
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          contextmenu: true,
          mouseWheelZoom: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          renderControlCharacters: true,
          colorDecorators: true,
          codeLens: false,
          folding: true,
          foldingHighlight: true,
          unfoldOnClickAfterEndOfLine: true,
          showFoldingControls: 'mouseover',
        }}
        beforeMount={(monaco) => {
          // Configure custom theme for industrial look
          monaco.editor.defineTheme('industrial-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: 'a0a0a0', fontStyle: 'italic' },
              { token: 'keyword', foreground: 'ff6b35', fontStyle: 'bold' },
              { token: 'string', foreground: '00ff41' },
              { token: 'number', foreground: 'ffff00' },
              { token: 'type', foreground: '00bfff' },
              { token: 'function', foreground: 'ffa500' },
              { token: 'variable', foreground: 'f0f0f0' },
              { token: 'operator', foreground: 'ff6b35' },
            ],
            colors: {
              'editor.background': '#1a1a1a',
              'editor.foreground': '#f0f0f0',
              'editorLineNumber.foreground': '#a0a0a0',
              'editorLineNumber.activeForeground': '#ff6b35',
              'editor.selectionBackground': '#ff6b3540',
              'editor.inactiveSelectionBackground': '#ff6b3520',
              'editorCursor.foreground': '#ff6b35',
              'editor.lineHighlightBackground': '#2d2d2d',
              'editorBracketMatch.background': '#ff6b3540',
              'editorBracketMatch.border': '#ff6b35',
              'scrollbarSlider.background': '#ff6b3540',
              'scrollbarSlider.hoverBackground': '#ff6b3560',
              'scrollbarSlider.activeBackground': '#ff6b3580',
            }
          });
          
          // Set the custom theme
          monaco.editor.setTheme('industrial-dark');
          
          // Add custom snippets for JavaScript cells
          if (cell.type === 'javascript') {
            monaco.languages.registerCompletionItemProvider('javascript', {
              provideCompletionItems: (model, position) => {
                const suggestions = [
                  {
                    label: 'env.DATABASES.RUN_SQL',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                      'const result = await env.DATABASES.RUN_SQL({',
                      '  sql: "${1:SELECT * FROM users LIMIT 10}"',
                      '});',
                      'console.log(result);$0'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Run SQL query against workspace database'
                  },
                  {
                    label: 'env.PROFILES.GET',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                      'const profile = await env.PROFILES.GET({});',
                      'console.log("Current user:", profile);$0'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'Get current user profile'
                  },
                  {
                    label: 'env.TEAMS.LIST',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: [
                      'const teams = await env.TEAMS.LIST({});',
                      'console.log("User teams:", teams.items);$0'
                    ].join('\n'),
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'List user teams'
                  },
                ];
                
                return { suggestions };
              }
            });
          }
        }}
      />
    </div>
  );
}
