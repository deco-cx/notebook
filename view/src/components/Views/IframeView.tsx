import React, { useRef, useEffect } from 'react';
import type { ViewProps } from '../../types/notebook';

export function IframeView({ cell, isFullscreen }: ViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(cell.content);
        doc.close();
      }
    }
  }, [cell.content]);

  return (
    <div className={`iframe-view ${isFullscreen ? 'h-screen' : 'h-64'}`}>
      <iframe
        ref={iframeRef}
        className="w-full h-full border border-gray-600 rounded bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="HTML Preview"
      />
    </div>
  );
}
