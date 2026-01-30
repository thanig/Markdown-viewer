import React, { useEffect, useRef } from 'react';
import './HtmlViewer.css';
import { CodeEditor } from './CodeEditor';

interface HtmlViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
}

export const HtmlViewer: React.FC<HtmlViewerProps> = ({
  content,
  viewMode,
  onChange,
  onToggleMode,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (viewMode === 'rendered' && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
      }
    }
  }, [content, viewMode]);

  if (viewMode === 'raw') {
    return (
      <div className="html-viewer">
        <div className="viewer-toolbar">
          <button onClick={onToggleMode} className="toolbar-button">
            🌐 Show Rendered
          </button>
        </div>
        <CodeEditor
          content={content}
          language="html"
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="html-viewer">
      <div className="viewer-toolbar">
        <button onClick={onToggleMode} className="toolbar-button">
          ✏️ Edit Raw
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="html-preview"
        title="HTML Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};
