import { useRef, useCallback, useEffect } from 'react';
import type { Cell as CellInterface } from '../../types/notebook';

export function useExcalidrawData(
  cell: CellInterface, 
  onContentChange: (content: string) => void
) {
  const excalidrawAPIRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Parse initial data from cell content
  const parseContent = useCallback((content: string) => {
    if (!content) {
      return {
        elements: [],
        appState: {
          viewBackgroundColor: '#1a1a1a',
          gridSize: undefined,
        },
      };
    }

    try {
      const parsed = JSON.parse(content);
      return {
        elements: parsed.elements || [],
        appState: {
          viewBackgroundColor: parsed.appState?.viewBackgroundColor || '#1a1a1a',
          gridSize: typeof parsed.appState?.gridSize === 'number' ? parsed.appState.gridSize : undefined,
          // Ensure collaborators is always a Map to prevent errors
          collaborators: new Map(),
          selectedElementIds: parsed.appState?.selectedElementIds || {},
        },
      };
    } catch (err) {
      console.warn('Failed to parse Excalidraw data, using defaults:', err);
      return {
        elements: [],
        appState: {
          viewBackgroundColor: '#1a1a1a',
          gridSize: undefined,
        },
      };
    }
  }, []);

  const getInitialData = useCallback(() => parseContent(cell.content), [cell.content, parseContent]);

  const serializeData = useCallback((elements: any[], appState: any) => {
    const data = {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      },
      timestamp: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }, []);

  // Handle Excalidraw changes (debounced persistence)
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    if (isUpdatingRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      const serializedData = serializeData(elements as any[], appState);
      onContentChange(serializedData);
    }, 800);
  }, [onContentChange, serializeData]);

  // Update scene when cell content changes externally
  const updateScene = useCallback((data: any) => {
    if (excalidrawAPIRef.current) {
      isUpdatingRef.current = true;
      
      try {
        excalidrawAPIRef.current.updateScene({
          elements: data.elements,
          appState: data.appState,
        });
      } catch (err) {
        console.error('Failed to update Excalidraw scene:', err);
      } finally {
        // Reset the flag after a short delay to ensure the update is processed
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, []);

  // Update scene when cell content changes externally
  useEffect(() => {
    if (excalidrawAPIRef.current && cell.content) {
      const data = getInitialData();
      updateScene(data);
    }
  }, [cell.content, getInitialData, updateScene]);

  return {
    // Refs
    excalidrawAPIRef,

    // State
    initialData: getInitialData,
    isUpdating: isUpdatingRef.current,

    // Actions
    handleChange,
    updateScene,

    // Utils
    parseContent,
    serializeData
  };
}
