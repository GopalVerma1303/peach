import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { Folder } from '@gopx-drive/core';

export default function FoldersList() {
  const { cache, api } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cache.getFolders().then((f) => {
      if (!cancelled) setFolders(f.filter((x) => !x.is_archived));
    });
    return () => { cancelled = true; };
  }, [cache]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await api.createFolder(newName.trim());
    if (data) {
      await cache.upsertFolder(data);
      setFolders((prev) => [data, ...prev]);
      setNewName('');
    }
    if (error) await cache.addPendingOp({ type: 'folder_create', payload: { name: newName.trim() } });
    setCreating(false);
  };

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="folder-opened" size={24} /> Folders
      </h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Folder name"
        />
        <button type="submit" disabled={creating}>
          <Codicon name="add" size={16} /> Create
        </button>
      </form>
      {folders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No folders.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {folders.map((f) => (
            <li key={f.id} className="list-item">
              <Link to={`/folders/${f.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Codicon name="folder-opened" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {f.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
