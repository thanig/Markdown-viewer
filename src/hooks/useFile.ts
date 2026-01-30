
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile, readDir, FileEntry } from '@tauri-apps/api/fs';

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

  const openFolder = async (): Promise<FileEntry[] | null> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        recursive: true,
      });

      if (!selected || Array.isArray(selected)) return null;

      // When opening a folder, we read its contents immediately (non-recursive for performance)
      // The FileTree component will handle lazy loading of subdirectories
      // Note: 'selected' from 'open' dialog is just the path string.  
      // We manually add the root folder itself to the list so the tree has a root.
      // Actually, standard file trees usually show the contents of the opened folder.
      // But creating a "Root" entry helps if we want to show the folder name itself capable of being collapsed.
      // For now, let's return the content of the selected folder.

      const entries = await readDir(selected, { recursive: true });
      return entries;
    } catch (error) {
      console.error('Failed to open folder:', error);
      return null;
    }
  };

  const readDirectory = async (path: string, recursive = true): Promise<FileEntry[] | null> => {
    try {
      const entries = await readDir(path, { recursive });
      return entries;
    } catch (error) {
      console.error('Failed to read directory:', error);
      return null;
    }
  };

  const readFileContent = async (path: string): Promise<{ path: string; content: string; name: string; language: string } | null> => {
    try {
      const content = await readTextFile(path);
      const name = path.split('/').pop() || path.split('\\').pop() || 'Untitled';
      const language = getLanguageFromPath(path);
      return { path, content, name, language };
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  };

  return {
    openFile,
    saveFile,
    saveFileAs,
    openFolder,
    readDirectory,
    readFileContent,
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
