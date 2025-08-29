import React, { useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Cell, ViewApp } from '../../types/notebook';

interface ViewWrapperProps {
  cell: Cell;
  selectedView: ViewApp;
  onContentChange: (content: string) => void;
  onViewDataChange: (data: Record<string, any>) => void;
  onExecute?: () => void;
}

export function ViewWrapper({ 
  cell, 
  selectedView, 
  onContentChange, 
  onViewDataChange,
  onExecute 
}: ViewWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const ViewComponent = selectedView.component;

  if (!ViewComponent) {
    return <div className="text-red-400 p-4">View component not found</div>;
  }

  // Inline (non-fullscreen) rendering
  const inlineContent = (
    <div 
      className="view-wrapper relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered) && selectedView.config?.fullscreenCapable && (
        <button
          className="absolute top-2 right-2 z-10 p-2 bg-black/70 text-white rounded hover:bg-black/90 transition-colors"
          onClick={() => setIsFullscreen(true)}
          title="Enter fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      )}

      <ViewComponent
        cell={cell}
        isFullscreen={false}
        onContentChange={onContentChange}
        onViewDataChange={onViewDataChange}
        onToggleFullscreen={() => setIsFullscreen(true)}
        onExecute={onExecute}
      />
    </div>
  );

  if (!isFullscreen) return inlineContent;

  // Fullscreen modal rendering via portal
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={() => setIsFullscreen(false)} />

      {/* Top bar */}
      <div className="relative z-[101] h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-gray-400">NOTEBOOK</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300">CELL_{cell.id}</span>
          <span className="text-gray-600">/</span>
          <span className="font-semibold text-white">{selectedView.name}</span>
        </div>
        <button
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded"
          onClick={() => setIsFullscreen(false)}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="relative z-[101] flex-1 bg-gray-900 overflow-hidden">
        <div className="w-full h-full">
          <ViewComponent
            cell={cell}
            isFullscreen={true}
            onContentChange={onContentChange}
            onViewDataChange={onViewDataChange}
            onToggleFullscreen={() => setIsFullscreen(false)}
            onExecute={onExecute}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
