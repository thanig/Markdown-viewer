import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';
import { CodeEditor, MonacoAction } from './CodeEditor';
import './MermaidBlock.css';
import { MermaidBlock } from './MermaidBlock';
import { createRoot } from 'react-dom/client';

interface MarkdownViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  editorActions?: MonacoAction[];
}

// Configure marked with syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang === 'mermaid') {
        return `<div class="mermaid">${code}</div>`;
      }
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
  editorActions,
}) => {
  const [html, setHtml] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === 'rendered') {
      const rendered = marked.parse(content) as string;
      setHtml(rendered);
    }
  }, [content, viewMode]);

  // Mermaid post-processing
  useEffect(() => {
    if (viewMode === 'rendered' && contentRef.current) {
      // Find all mermaid divs that we created in the highlight function
      // Note: marked-highlight might wrap the output in <pre><code>...</code></pre>
      // But since we returned a div for mermaid, it might be inside pre/code.
      // Actually, marked usually wraps code blocks in <pre><code>.
      // If we want to replace the whole block, we need to be careful.

      // Let's iterate over code blocks and check for language-mermaid class
      const mermaidBlocks = contentRef.current.querySelectorAll('.language-mermaid');
      mermaidBlocks.forEach((block) => {
        const chartContent = block.textContent || '';
        const container = document.createElement('div');
        // Replace the <pre> parent if possible, or just the <code> block
        const parent = block.parentElement; // usually <pre>

        if (parent && parent.tagName === 'PRE') {
          parent.replaceWith(container);
          const root = createRoot(container);
          root.render(<MermaidBlock chart={chartContent} />);
        }
      });
    }
  }, [html, viewMode]);

  if (viewMode === 'raw') {
    return (
      <div className="markdown-viewer">
        {/* Toolbar moved to main app header per request, keeping logic clean */}
        <CodeEditor
          content={content}
          language="markdown"
          onChange={onChange}
          actions={editorActions}
        />
      </div>
    );
  }

  return (
    <div className="markdown-viewer">
      <div
        ref={contentRef}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
