import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { FileRecord } from '@gopx-drive/core';

export default function Files() {
  const { user, cache, api } = useAuth();
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

  const handleArchive = async (f: FileRecord) => {
    await cache.upsertFile({ ...f, is_archived: true, updated_at: new Date().toISOString() });
    await cache.addPendingOp({ type: 'file_update', id: f.id, payload: { is_archived: true } });
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
  };

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="file" size={24} /> Files
      </h1>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        <Codicon name="cloud-upload" size={16} /> Upload file
      </button>
      {files.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No files.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {files.map((f) => (
            <li key={f.id} className="list-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Codicon name="file" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {f.name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                {(f.file_size / 1024).toFixed(1)} KB
              </span>
              <button type="button" className="secondary" onClick={() => handleArchive(f)}>
                <Codicon name="archive" size={16} /> Archive
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
