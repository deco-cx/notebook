import { useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ViewProps } from '../../types/notebook';

export function ExcalidrawView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const excalidrawAPIRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Parse initial data from cell content
  const getInitialData = useCallback(() => {
    if (!cell.content) {
      return {
        elements: [],
        appState: {
          viewBackgroundColor: '#1a1a1a',
          gridSize: undefined,
        },
      };
    }

    try {
      const parsed = JSON.parse(cell.content);
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
  }, [cell.content]);

  // Handle Excalidraw changes (debounced persistence)
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    if (isUpdatingRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
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
      onContentChange(JSON.stringify(data, null, 2));
    }, 800);
  }, [onContentChange]);

  // Update scene when cell content changes externally
  useEffect(() => {
    if (excalidrawAPIRef.current && cell.content) {
      isUpdatingRef.current = true;
      
      try {
        const data = getInitialData();
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
  }, [cell.content, getInitialData]);

  const initialData = getInitialData;

  return (
    <div 
      className={`excalidraw-view ${isFullscreen ? 'h-full' : 'h-96'} bg-gray-900 rounded overflow-hidden`}
    >
      <Excalidraw
        excalidrawAPI={(api: any) => {
          excalidrawAPIRef.current = api;
        }}
        initialData={initialData}
        onChange={handleChange}
        theme="dark"
        name="notebook-drawing"
        UIOptions={
          isFullscreen
            ? {
                canvasActions: {
                  saveToActiveFile: false,
                  loadScene: false,
                  export: {},
                  // saveAsImage expects boolean in some versions; disable unless needed
                  saveAsImage: true,
                },
              }
            : {
                canvasActions: {
                  saveToActiveFile: false,
                  loadScene: false,
                  export: false,
                  saveAsImage: false,
                },
              }
        }
        gridModeEnabled={false}
        zenModeEnabled={false}
        viewModeEnabled={false}
      />
    </div>
  );
}
