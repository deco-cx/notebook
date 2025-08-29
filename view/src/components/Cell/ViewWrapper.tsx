import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
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

  return (
    <div 
      className={`view-wrapper relative ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fullscreen toggle button */}
      {(isHovered || isFullscreen) && selectedView.config?.fullscreenCapable && (
        <button
          className="absolute top-2 right-2 z-10 p-2 bg-black/70 text-white rounded hover:bg-black/90 transition-colors"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      {/* View component */}
      <ViewComponent
        cell={cell}
        isFullscreen={isFullscreen}
        onContentChange={onContentChange}
        onViewDataChange={onViewDataChange}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onExecute={onExecute}
      />

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <div 
          className="absolute inset-0 bg-black/20 -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}
