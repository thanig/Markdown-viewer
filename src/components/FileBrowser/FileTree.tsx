import React, { useState, useEffect } from 'react';
import { FileEntry } from '@tauri-apps/api/fs';

interface FileTreeProps {
    files: FileEntry[];
    onFileClick: (path: string, isDoubleClick: boolean) => void;
    onFolderExpand: (path: string) => Promise<FileEntry[] | null>;
    level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, onFolderExpand, level = 0 }) => {
    if (!files || files.length === 0) {
        return null;
    }

    // Sort files: directories first, then files, both alphabetically
    // Using generic type for sort to avoid TS errors if needed, but FileEntry fits
    const sortedFiles = [...files].sort((a, b) => {
        if (a.children && !b.children) return -1;
        if (!a.children && b.children) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });

    return (
        <div className="file-tree">
            {sortedFiles.map((file) => (
                <FileTreeNode
                    key={file.path}
                    file={file}
                    level={level}
                    onFileClick={onFileClick}
                    onFolderExpand={onFolderExpand}
                />
            ))}
        </div>
    );
};

interface FileTreeNodeProps {
    file: FileEntry;
    level: number;
    onFileClick: (path: string, isDoubleClick: boolean) => void;
    onFolderExpand: (path: string) => Promise<FileEntry[] | null>;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ file, level, onFileClick, onFolderExpand }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[] | undefined>(file.children);
    const [isLoading, setIsLoading] = useState(false);

    // Update children if prop changes (e.g. initial load)
    useEffect(() => {
        if (file.children) {
            setChildren(file.children);
        }
    }, [file.children]);

    const isDirectory = !!file.children || (file as any).is_dir; // tauri can sometimes return is_dir

    const handleclick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        console.log('Clicked file:', file.path, 'Is Directory:', isDirectory, 'Is Expanded:', isExpanded);
        console.log('File Object:', file);

        if (isDirectory) {
            if (!isExpanded && !children) {
                setIsLoading(true);
                const newChildren = await onFolderExpand(file.path);
                setIsLoading(false);
                if (newChildren) {
                    setChildren(newChildren);
                }
            }
            setIsExpanded(!isExpanded);
        } else {
            // Handle single click (preview) vs double click (pin) logic in parent if needed
            // For now we just pass the event type
            onFileClick(file.path, e.detail === 2);
        }
    };

    return (
        <div className="file-tree-item">
            <div
                className={`file-row ${isDirectory ? 'directory' : 'file'}`}
                onClick={handleclick}
                style={{ paddingLeft: `${level * 12 + 10}px` }}
                title={file.path}
            >
                {/* Indentation guides would be CSS borders on a container, complex to do simply with padding */}
                <span className={`file-icon ${isLoading ? 'loading' : ''}`}>
                    {isLoading ? '⟳' : (isDirectory ? (isExpanded ? '📂' : '📁') : '📄')}
                </span>
                <span className="file-name">
                    {file.name}
                </span>
            </div>

            {isDirectory && isExpanded && children && (
                <FileTree
                    files={children}
                    onFileClick={onFileClick}
                    onFolderExpand={onFolderExpand}
                    level={level + 1}
                />
            )}
        </div>
    );
};
