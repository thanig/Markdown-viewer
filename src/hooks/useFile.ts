import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

export const useFile = () => {
  const openFile = async (): Promise<{ path: string; content: string; name: string; language: string } | null> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'All Supported',
            extensions: ['md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html', 'txt', 'yml', 'yaml', 'xml', 'py', 'rs', 'go', 'java'],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) return null;

      const content = await readTextFile(selected);
      const name = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';
      const language = getLanguageFromPath(selected);

      return { path: selected, content, name, language };
    } catch (error) {
      console.error('Failed to open file:', error);
      return null;
    }
  };

  const saveFile = async (path: string, content: string): Promise<boolean> => {
    try {
      await writeTextFile(path, content);
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  };

  const saveFileAs = async (content: string): Promise<string | null> => {
    try {
      const selected = await save();
      if (!selected) return null;

      await writeTextFile(selected, content);
      return selected;
    } catch (error) {
      console.error('Failed to save file:', error);
      return null;
    }
  };

  return {
    openFile,
    saveFile,
    saveFileAs,
  };
};

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();

  const languageMap: { [key: string]: string } = {
    'md': 'markdown',
    'markdown': 'markdown',
    'json': 'json',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'html': 'html',
    'xml': 'xml',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'yml': 'yaml',
    'yaml': 'yaml',
    'txt': 'plaintext',
  };

  return languageMap[ext || ''] || 'plaintext';
}
