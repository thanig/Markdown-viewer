export interface FileTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
  viewMode: 'rendered' | 'raw';
}

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

export type ViewerMode = 'markdown' | 'json' | 'code';
