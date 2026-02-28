import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from './Codicon';
import type { FileRecord } from '@gopx-drive/core';

export default function FilesFileList() {
  const { user, cache, api } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    cache.getFiles().then((f) => {
      if (!cancelled) setFiles(f.filter((x) => !x.is_archived));
    });
    return () => { cancelled = true; };
  }, [cache]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadErr } = await api.uploadFile(user.id, path, file);
    if (uploadErr) {
      alert(uploadErr.message);
      return;
    }
    const record: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      name: file.name,
      file_path: `${user.id}/${path}`,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      extension: file.name.split('.').pop() || '',
      folder_id: null,
      is_archived: false,
    };
    const { data, error } = await api.createFileRecord(record);
    if (error) {
      alert(error.message);
      return;
    }
    if (data) {
      await cache.upsertFile(data);
      setFiles((prev) => [data, ...prev]);
    }
    e.target.value = '';
  };

  const currentFileId = id || null;

  return (
    <div className="files-file-list">
      <div className="files-file-list-header">
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <button
          type="button"
          className="obsidian-icon-btn"
          title="Upload file"
          onClick={() => fileInputRef.current?.click()}
        >
          <Codicon name="add" size={16} />
        </button>
      </div>
      <div className="files-file-list-items">
        {files.map((f) => (
          <Link
            key={f.id}
            to={`/files/${f.id}`}
            className={`files-file-item ${currentFileId === f.id ? 'active' : ''}`}
          >
            <span className="files-file-title">{f.name}</span>
          </Link>
        ))}
        {files.length === 0 && (
          <div className="files-file-empty">
            <p>No files yet</p>
            <button
              type="button"
              className="notes-new-link"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload your first file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
