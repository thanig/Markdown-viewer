import React, { useState, useEffect } from 'react';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import './JsonViewer.css';
import { CodeEditor } from './CodeEditor';

interface JsonViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  content,
  viewMode,
  onChange,
  onToggleMode,
}) => {
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatted, setFormatted] = useState(false);

  useEffect(() => {
    if (viewMode === 'rendered') {
      try {
        const parsed = JSON.parse(content);
        setJsonData(parsed);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
        setJsonData(null);
      }
    }
  }, [content, viewMode]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setFormatted(true);
      setTimeout(() => setFormatted(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(content);
      const minified = JSON.stringify(parsed);
      onChange(minified);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  if (viewMode === 'raw') {
    return (
      <div className="json-viewer">
        <div className="viewer-toolbar">
          <button onClick={onToggleMode} className="toolbar-button">
            🌳 Show Tree View
          </button>
          <button onClick={handleFormat} className="toolbar-button">
            {formatted ? '✓ Formatted' : '✨ Format'}
          </button>
          <button onClick={handleMinify} className="toolbar-button">
            📦 Minify
          </button>
          {error && <span className="error-message">{error}</span>}
        </div>
        <CodeEditor
          content={content}
          language="json"
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="json-viewer">
      <div className="viewer-toolbar">
        <button onClick={onToggleMode} className="toolbar-button">
          ✏️ Edit Raw
        </button>
      </div>
      <div className="json-content">
        {error ? (
          <div className="json-error">
            <h3>Invalid JSON</h3>
            <p>{error}</p>
          </div>
        ) : jsonData ? (
          <JsonView
            data={jsonData}
            shouldExpandNode={allExpanded}
            style={{
              ...defaultStyles,
              container: 'json-tree-container',
              basicChildStyle: 'json-tree-item',
              label: 'json-tree-label',
              nullValue: 'json-tree-null',
              undefinedValue: 'json-tree-undefined',
              numberValue: 'json-tree-number',
              stringValue: 'json-tree-string',
              booleanValue: 'json-tree-boolean',
            }}
          />
        ) : (
          <div className="json-empty">No JSON data</div>
        )}
      </div>
    </div>
  );
};
