import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { Folder, NoteWithDirty, FileRecord } from '@gopx-drive/core';

export default function FolderDetail() {
  const { id } = useParams<{ id: string }>();
  const { cache } = useAuth();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<NoteWithDirty[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [tab, setTab] = useState<'notes' | 'files'>('notes');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [folders, allNotes, allFiles] = await Promise.all([
        cache.getFolders(),
        cache.getNotes(),
        cache.getFiles(),
      ]);
      if (cancelled) return;
      const f = folders.find((x) => x.id === id) ?? null;
      setFolder(f);
      setNotes(allNotes.filter((n) => n.folder_id === id && !n.is_archived));
      setFiles(allFiles.filter((x) => x.folder_id === id && !x.is_archived));
    })();
    return () => { cancelled = true; };
  }, [id, cache]);

  if (!folder) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="folder-opened" size={24} /> {folder.name}
      </h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={tab === 'notes' ? '' : 'secondary'}
          onClick={() => setTab('notes')}
        >
          <Codicon name="file-text" size={16} /> Notes
        </button>
        <button
          type="button"
          className={tab === 'files' ? '' : 'secondary'}
          onClick={() => setTab('files')}
        >
          <Codicon name="file" size={16} /> Files
        </button>
      </div>
      {tab === 'notes' && (
        <>
          {notes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No notes in this folder.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {notes.map((n) => (
                <li key={n.id} className="list-item">
                  <Link to={`/notes/${n.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Codicon name="file-text" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {n.title || 'Untitled'}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {tab === 'files' && (
        <>
          {files.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No files in this folder.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map((f) => (
                <li key={f.id} className="list-item">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Codicon name="file" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {f.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
