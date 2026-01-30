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

  const createNewFile = async (fileType: string): Promise<{ path: string; content: string; name: string; language: string } | null> => {
    try {
      // Get default extension and template content based on file type
      const { extension, content: templateContent } = getTemplateForFileType(fileType);

      // Show save dialog with suggested extension
      const selected = await save({
        filters: [{
          name: fileType.charAt(0).toUpperCase() + fileType.slice(1) + ' File',
          extensions: [extension],
        }],
        defaultPath: `untitled.${extension}`,
      });

      if (!selected) return null;

      // Write template content to file
      await writeTextFile(selected, templateContent);

      // Extract file name
      const name = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';

      // Detect language
      const language = getLanguageFromPath(selected);

      return { path: selected, content: templateContent, name, language };
    } catch (error) {
      console.error('Failed to create file:', error);
      return null;
    }
  };

  return {
    openFile,
    saveFile,
    saveFileAs,
    createNewFile,
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
