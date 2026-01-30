import { useEffect, useRef, useState } from 'react';
import './HtmlViewer.css';
import { CodeEditor, MonacoAction } from './CodeEditor';

interface HtmlViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
  editorActions?: MonacoAction[];
}

export const HtmlViewer = ({
  content,
  viewMode,
  onChange,
  onToggleMode,
  editorActions,
}: HtmlViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'rendered' && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;

        if (doc) {
          doc.open();
          doc.write(content);
          doc.close();
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render HTML');
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
          actions={editorActions}
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
        {error && <span className="error-message">{error}</span>}
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
