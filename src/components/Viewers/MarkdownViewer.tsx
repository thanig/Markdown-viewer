import { useEffect, useState, useRef, useCallback } from 'react';
import { marked, Renderer } from 'marked';
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
let mermaidInitialized = false;

function initializeMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'var(--font-mono)',
  });

  mermaidInitialized = true;
}

function configureMarked() {
  if (markedConfigured) return;

  // Custom renderer to handle mermaid code blocks
  const renderer = new Renderer();
  const originalCode = renderer.code.bind(renderer);

  renderer.code = function(code: string, infostring: string | undefined, escaped: boolean): string {
    if (infostring === 'mermaid') {
      // Return a container for mermaid to render into
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      return `<div class="mermaid-container"><pre class="mermaid" id="${id}">${code}</pre></div>`;
    }
    // Use original renderer for other code blocks
    return originalCode(code, infostring, escaped);
  };

  // Configure marked with syntax highlighting
  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang === 'mermaid') return code; // Don't highlight mermaid
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    })
  );

  // Apply custom renderer
  marked.use({ renderer });

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

  // Initialize marked and mermaid
  useEffect(() => {
    if (!configured.current) {
      configureMarked();
      initializeMermaid();
      configured.current = true;
    }
  }, []);

  // Parse markdown when content changes
  useEffect(() => {
    if (viewMode === 'rendered') {
      const rendered = marked.parse(content) as string;
      setHtml(rendered);
    }
  }, [content, viewMode]);

  // Render mermaid diagrams after HTML is set
  const renderMermaidDiagrams = useCallback(async () => {
    if (contentRef.current && viewMode === 'rendered') {
      const mermaidElements = contentRef.current.querySelectorAll('.mermaid');
      if (mermaidElements.length > 0) {
        try {
          await mermaid.run({
            nodes: mermaidElements as NodeListOf<HTMLElement>,
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
        }
      }
    }
  }, [viewMode]);

  useEffect(() => {
    renderMermaidDiagrams();
  }, [html, renderMermaidDiagrams]);

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
