import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { FileRecord } from '@gopx-drive/core';

export default function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const { cache, api } = useAuth();
  const [file, setFile] = useState<FileRecord | null | undefined>(undefined);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    cache.getFiles().then((files) => {
      if (cancelled) return;
      const f = files.find((x) => x.id === id);
      setFile(f ?? null);
      if (f) {
        api.getFileUrl(f.file_path).then((url) => {
          if (!cancelled) setFileUrl(url ?? null);
        });
      }
    });
    return () => { cancelled = true; };
  }, [id, cache, api]);

  const handleDownload = async () => {
    if (!file || !fileUrl) return;
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  const handleOpenInBrowser = () => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPreviewable = (mime: string) => {
    return (
      mime.startsWith('image/') ||
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      mime === 'application/pdf' ||
      mime.startsWith('text/')
    );
  };

  if (file === undefined) return <div className="obsidian-loading">Loading...</div>;
  if (!file) return <div className="obsidian-loading">File not found</div>;

  return (
    <div className="obsidian-file-layout">
      {/* Files header bar */}
      <header className="obsidian-files-header">
        <div className="obsidian-files-header-left">
          <button
            type="button"
            className="obsidian-icon-btn"
            title="Download"
            onClick={handleDownload}
          >
            <Codicon name="download" size={18} />
          </button>
          <button
            type="button"
            className="obsidian-icon-btn"
            title="Open in browser"
            onClick={handleOpenInBrowser}
          >
            <Codicon name="link-external" size={18} />
          </button>
        </div>
      </header>

      {/* Main content + right sidebar */}
      <div className="obsidian-content-wrapper">
        <main className="obsidian-main-content obsidian-file-preview">
          {fileUrl && isPreviewable(file.mime_type) ? (
            file.mime_type.startsWith('image/') ? (
              <img src={fileUrl} alt={file.name} className="file-preview-image" />
            ) : file.mime_type.startsWith('video/') ? (
              <video src={fileUrl} controls className="file-preview-video" />
            ) : file.mime_type.startsWith('audio/') ? (
              <audio src={fileUrl} controls className="file-preview-audio" />
            ) : file.mime_type === 'application/pdf' ? (
              <iframe src={fileUrl} title={file.name} className="file-preview-iframe" />
            ) : (
              <iframe src={fileUrl} title={file.name} className="file-preview-iframe" sandbox="allow-same-origin" />
            )
          ) : (
            <div className="file-preview-placeholder">
              <Codicon name="file" size={48} />
              <p>{file.name}</p>
              <p className="file-preview-type">{file.mime_type}</p>
            </div>
          )}
        </main>

        <aside className="obsidian-sidebar-right">
          <div className="file-info-panel">
            <div className="file-info-header">
              <Codicon name="info" size={14} />
              <span>File info</span>
            </div>
            <dl className="file-info-list">
              <dt>Name</dt>
              <dd>{file.name}</dd>
              <dt>Size</dt>
              <dd>{formatSize(file.file_size)}</dd>
              <dt>Type</dt>
              <dd>{file.mime_type}</dd>
              <dt>Extension</dt>
              <dd>{file.extension || '—'}</dd>
              <dt>Uploaded</dt>
              <dd>{new Date(file.created_at).toLocaleString()}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
