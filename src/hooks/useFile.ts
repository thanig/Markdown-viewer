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

  const openFilePath = async (filePath: string): Promise<{ path: string; content: string; name: string; language: string } | null> => {
    try {
      const content = await readTextFile(filePath);
      const name = filePath.split('/').pop() || filePath.split('\\').pop() || 'Untitled';
      const language = getLanguageFromPath(filePath);

      return { path: filePath, content, name, language };
    } catch (error) {
      console.error('Failed to open file:', error);
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

  // Create a new untitled file in memory (not saved to disk)
  const createUntitledFile = (fileType: string, untitledNumber: number): { path: string; content: string; name: string; language: string } => {
    const { extension, content: templateContent } = getTemplateForFileType(fileType);
    const name = `Untitled-${untitledNumber}.${extension}`;
    const path = `untitled://${name}`;
    const language = getLanguageFromExtension(extension);

    return { path, content: templateContent, name, language };
  };

  // Save an untitled file - prompts for location
  const saveUntitledFile = async (content: string, fileType: string): Promise<{ path: string; name: string; language: string } | null> => {
    try {
      const { extension } = getTemplateForFileType(fileType);

      const selected = await save({
        filters: [{
          name: fileType.charAt(0).toUpperCase() + fileType.slice(1) + ' File',
          extensions: [extension],
        }],
        defaultPath: `untitled.${extension}`,
      });

      if (!selected) return null;

      await writeTextFile(selected, content);

      const name = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';
      const language = getLanguageFromPath(selected);

      return { path: selected, name, language };
    } catch (error) {
      console.error('Failed to save file:', error);
      return null;
    }
  };

  return {
    openFile,
    openFilePath,
    saveFile,
    saveFileAs,
    openFolder,
    readDirectory,
    readFileContent,
    createUntitledFile,
    saveUntitledFile,
  };
};

// Check if a path is an untitled file
export const isUntitledPath = (path: string): boolean => {
  return path.startsWith('untitled://');
};

// Get language from file type
export const getLanguageForFileType = (fileType: string): string => {
  const languageMap: { [key: string]: string } = {
    'markdown': 'markdown',
    'json': 'json',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'html': 'html',
    'css': 'css',
    'python': 'python',
    'text': 'plaintext',
  };
  return languageMap[fileType] || 'plaintext';
};

function getLanguageFromExtension(ext: string): string {
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

  return languageMap[ext.toLowerCase()] || 'plaintext';
}

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

function getTemplateForFileType(fileType: string): { extension: string; content: string } {
  const templates: { [key: string]: { extension: string; content: string } } = {
    'markdown': {
      extension: 'md',
      content: '# Untitled\n\nStart writing your markdown here...\n',
    },
    'json': {
      extension: 'json',
      content: '{\n  \n}\n',
    },
    'html': {
      extension: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>

</body>
</html>
`,
    },
    'javascript': {
      extension: 'js',
      content: '// JavaScript file\n\n',
    },
    'typescript': {
      extension: 'ts',
      content: '// TypeScript file\n\n',
    },
    'css': {
      extension: 'css',
      content: '/* Stylesheet */\n\n',
    },
    'python': {
      extension: 'py',
      content: '# Python script\n\n',
    },
    'text': {
      extension: 'txt',
      content: '',
    },
  };

  return templates[fileType] || { extension: 'txt', content: '' };
}
