import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ViewProps } from '../../types/notebook';
import { useExcalidrawData } from '../../hooks';

export function ExcalidrawView({ cell, onContentChange, isFullscreen }: ViewProps) {
  const excalidrawData = useExcalidrawData(cell, onContentChange);

  return (
    <div 
      className={`excalidraw-view ${isFullscreen ? 'h-full' : 'h-96'} bg-gray-900 rounded overflow-hidden`}
    >
      <Excalidraw
        excalidrawAPI={(api: any) => {
          excalidrawData.excalidrawAPIRef.current = api;
        }}
        initialData={excalidrawData.initialData}
        onChange={excalidrawData.handleChange}
        theme="light"
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
