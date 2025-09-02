import type { ViewProps } from '../../types/notebook';

export function IframeView({ cell, isFullscreen }: ViewProps) {
  // Use srcdoc for better compatibility and security
  return (
    <div className={`iframe-view ${isFullscreen ? 'h-full p-4' : 'h-64'}`}>
      <iframe
        srcDoc={cell.content}
        className="w-full h-full border-2 border-gray-600 rounded bg-white"
        sandbox="allow-scripts"
        title="HTML Preview"
        style={{
          minHeight: isFullscreen ? 'calc(100vh - 4rem)' : '250px',
        }}
      />
    </div>
  );
}
