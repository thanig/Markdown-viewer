import { CursorPosition } from '../Viewers/CodeEditor';
import './StatusBar.css';

interface StatusBarProps {
  language: string | null;
  cursorPosition: CursorPosition | null;
  tabCount: number;
}

const languageDisplayNames: Record<string, string> = {
  markdown: 'Markdown',
  json: 'JSON',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  xml: 'XML',
  yaml: 'YAML',
  plaintext: 'Plain Text',
};

export const StatusBar = ({ language, cursorPosition, tabCount }: StatusBarProps) => {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {tabCount > 0 && (
          <span className="status-item">{tabCount} {tabCount === 1 ? 'tab' : 'tabs'}</span>
        )}
      </div>
      <div className="status-bar-right">
        {cursorPosition && (
          <span className="status-item">
            Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
          </span>
        )}
        <span className="status-item">UTF-8</span>
        {language && (
          <span className="status-item">{languageDisplayNames[language] || language}</span>
        )}
      </div>
    </div>
  );
};
