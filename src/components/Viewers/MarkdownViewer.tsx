import { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import 'highlight.js/styles/github-dark.css';
import './MarkdownViewer.css';
import { CodeEditor, MonacoAction } from './CodeEditor';

interface MarkdownViewerProps {
  content: string;
  viewMode: 'rendered' | 'raw';
  onChange: (content: string) => void;
  onToggleMode: () => void;
  editorActions?: MonacoAction[];
}

// Configure mermaid with custom color palette
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    // Primary colors based on the design
    primaryColor: '#E6E6FA',        // Light lavender for boxes
    primaryTextColor: '#1a1a1a',     // Dark text for readability
    primaryBorderColor: '#9370DB',   // Medium purple for borders
    lineColor: '#9370DB',            // Purple for connection lines
    secondaryColor: '#FFFACD',       // Light yellow/cream for containers
    tertiaryColor: '#F0E68C',        // Khaki for tertiary elements

    // Background colors
    background: '#FFFACD',           // Light yellow background
    mainBkg: '#E6E6FA',              // Light lavender for main elements
    secondaryBkg: '#FFFACD',         // Light yellow for secondary elements
    tertiaryBkg: '#FFF8DC',          // Cornsilk for tertiary background

    // Text colors
    textColor: '#1a1a1a',            // Dark text
    labelTextColor: '#1a1a1a',       // Dark label text

    // Node colors
    nodeBorder: '#9370DB',           // Purple node borders
    clusterBkg: '#FFFACD',           // Light yellow for clusters/containers
    clusterBorder: '#9370DB',        // Purple cluster borders

    // Additional colors
    edgeLabelBackground: '#ffffff',
    fontSize: '14px',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

// Lazy initialization flag
let markedConfigured = false;

function configureMarked() {
  if (markedConfigured) return;

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

  markedConfigured = true;
}

export const MarkdownViewer = ({
  content,
  viewMode,
  onChange,
  onToggleMode,
  editorActions,
}: MarkdownViewerProps) => {
  const [html, setHtml] = useState('');
  const configured = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidCounterRef = useRef(0);

  useEffect(() => {
    if (!configured.current) {
      configureMarked();
      configured.current = true;
    }

    if (viewMode === 'rendered') {
      // Reset mermaid counter for each render
      mermaidCounterRef.current = 0;

      // Custom renderer for mermaid code blocks
      const renderer = new marked.Renderer();
      const originalCodeRenderer = renderer.code.bind(renderer);

      renderer.code = (code: string, language: string | undefined, escaped: boolean) => {
        if (language === 'mermaid') {
          const id = `mermaid-${Date.now()}-${mermaidCounterRef.current++}`;
          return `<div class="mermaid" id="${id}">${code}</div>`;
        }
        return originalCodeRenderer(code, language, escaped);
      };

      marked.use({ renderer });
      const rendered = marked.parse(content) as string;
      setHtml(rendered);
    }
  }, [content, viewMode]);

  // Render mermaid diagrams after HTML is set
  useEffect(() => {
    if (viewMode === 'rendered' && contentRef.current) {
      const mermaidElements = contentRef.current.querySelectorAll('.mermaid');

      if (mermaidElements.length > 0) {
        mermaidElements.forEach((element) => {
          const id = element.id;
          const code = element.textContent || '';

          // Clear the element before rendering
          element.textContent = '';

          // Render the mermaid diagram
          mermaid.render(id, code).then(({ svg }) => {
            element.innerHTML = svg;
          }).catch((error) => {
            console.error('Mermaid rendering error:', error);
            element.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`;
          });
        });
      }
    }
  }, [html, viewMode]);

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
          actions={editorActions}
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
        ref={contentRef}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
