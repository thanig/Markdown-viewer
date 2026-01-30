import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';
import { CodeEditor } from './CodeEditor';

interface MarkdownViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
}

// Configure marked with syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  viewMode,
  onChange,
  onToggleMode,
}) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (viewMode === 'rendered') {
      const rendered = marked.parse(content) as string;
      setHtml(rendered);
    }
  }, [content, viewMode]);

  if (viewMode === 'raw') {
    return (
      <div className="markdown-viewer">
        <div className="viewer-toolbar">
          <button onClick={onToggleMode} className="toolbar-button">
            📄 Show Rendered
          </button>
        </div>
        <CodeEditor
          content={content}
          language="markdown"
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div className="markdown-viewer">
      <div className="viewer-toolbar">
        <button onClick={onToggleMode} className="toolbar-button">
          ✏️ Edit Raw
        </button>
      </div>
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
