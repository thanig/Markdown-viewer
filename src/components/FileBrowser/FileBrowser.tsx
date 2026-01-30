import React, { useState } from 'react';
import { FileEntry } from '@tauri-apps/api/fs';
import { FileTree } from './FileTree';
import './FileBrowser.css';

interface FileBrowserProps {
    onFileOpen: (path: string, preview: boolean) => void;
    onOpenFolder: () => Promise<FileEntry[] | null>;
    onReadDirectory: (path: string) => Promise<FileEntry[] | null>;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onFileOpen, onOpenFolder, onReadDirectory }) => {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const handleOpenFolder = async () => {
        setLoading(true);
        const data = await onOpenFolder();
        if (data) {
            setFiles(data);
        }
        setLoading(false);
    };

    const handleFolderExpand = async (path: string) => {
        return await onReadDirectory(path);
    };

    const handleFileClick = (path: string, isDoubleClick: boolean) => {
        // If double click, we want to 'pin' it (open permanently)
        // If single click, we want to 'preview' it
        // The App component will handle what 'preview' vs 'pin' means
        onFileOpen(path, !isDoubleClick);
    };

    return (
        <div className="file-browser">
            <div className="file-browser-header">
                <h3>Explorer</h3>
                <button className="open-folder-btn" onClick={handleOpenFolder} disabled={loading}>
                    {loading ? '...' : 'Open Folder'}
                </button>
            </div>
            <div className="file-browser-content">
                <FileTree
                    files={files}
                    onFileClick={handleFileClick}
                    onFolderExpand={handleFolderExpand}
                />
            </div>
        </div>
    );
};
