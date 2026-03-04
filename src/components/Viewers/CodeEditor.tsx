import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import './CodeEditor.css';

export interface MonacoAction {
  id: string;
  label: string;
  keybindings?: number[];
  contextMenuGroupId?: string;
  contextMenuOrder?: number;
  run: () => void;
}

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
  actions?: MonacoAction[];
}

export const CodeEditor = ({ content, language, onChange, actions }: CodeEditorProps) => {
  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    // Register custom actions with Monaco
    if (actions) {
      actions.forEach(action => {
        editor.addAction({
          id: action.id,
          label: action.label,
          keybindings: action.keybindings,
          contextMenuGroupId: action.contextMenuGroupId || 'navigation',
          contextMenuOrder: action.contextMenuOrder || 1,
          run: () => action.run(),
        });
      });
    }
  };

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          renderWhitespace: 'selection',
          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, monospace',
        }}
      />
    </div>
  );
};
