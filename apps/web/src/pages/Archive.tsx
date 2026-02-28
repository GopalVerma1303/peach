import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { NoteWithDirty, FileRecord, Folder } from '@gopx-drive/core';

type ArchiveTab = 'notes' | 'files' | 'folders';

export default function Archive() {
  const { cache, api } = useAuth();
  const [tab, setTab] = useState<ArchiveTab>('notes');
  const [notes, setNotes] = useState<NoteWithDirty[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, f, fo] = await Promise.all([
        cache.getNotes(),
        cache.getFiles(),
        cache.getFolders(),
      ]);
      if (!cancelled) {
        setNotes(n.filter((x) => x.is_archived));
        setFiles(f.filter((x) => x.is_archived));
        setFolders(fo.filter((x) => x.is_archived));
      }
    })();
    return () => { cancelled = true; };
  }, [cache]);

  const restoreNote = async (note: NoteWithDirty) => {
    await cache.upsertNote({ ...note, is_archived: false, updated_at: new Date().toISOString(), dirty: true });
    await cache.addPendingOp({ type: 'note_update', id: note.id, payload: { is_archived: false } });
    setNotes((prev) => prev.filter((x) => x.id !== note.id));
  };

  const deleteNote = async (note: NoteWithDirty) => {
    await api.deleteNote(note.id);
    await cache.deleteNote(note.id);
    setNotes((prev) => prev.filter((x) => x.id !== note.id));
  };

  const restoreFile = async (file: FileRecord) => {
    await cache.upsertFile({ ...file, is_archived: false, updated_at: new Date().toISOString() });
    await cache.addPendingOp({ type: 'file_update', id: file.id, payload: { is_archived: false } });
    setFiles((prev) => prev.filter((x) => x.id !== file.id));
  };

  const deleteFile = async (file: FileRecord) => {
    await api.deleteFileRecord(file.id);
    await api.deleteFileStorage(file.file_path);
    await cache.deleteFile(file.id);
    setFiles((prev) => prev.filter((x) => x.id !== file.id));
  };

  const restoreFolder = async (folder: Folder) => {
    await cache.upsertFolder({ ...folder, is_archived: false, updated_at: new Date().toISOString() });
    await cache.addPendingOp({ type: 'folder_update', id: folder.id, payload: { is_archived: false } });
    setFolders((prev) => prev.filter((x) => x.id !== folder.id));
  };

  const deleteFolder = async (folder: Folder) => {
    await api.deleteFolder(folder.id);
    await cache.deleteFolder(folder.id);
    setFolders((prev) => prev.filter((x) => x.id !== folder.id));
  };

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="archive" size={24} /> Archive
      </h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['notes', 'files', 'folders'] as const).map((t) => {
          const icon = t === 'notes' ? 'file-text' : t === 'files' ? 'file' : 'folder-opened';
          return (
            <button
              key={t}
              type="button"
              className={tab === t ? '' : 'secondary'}
              onClick={() => setTab(t)}
            >
              <Codicon name={icon} size={16} /> {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>
      {tab === 'notes' && (
        <>
          {notes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No archived notes.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {notes.map((n) => (
                <li key={n.id} className="list-item">
                  <span>{n.title || 'Untitled'}</span>
                  <span>
                    <button type="button" className="secondary" onClick={() => restoreNote(n)}>
                      <Codicon name="unarchive" size={14} /> Restore
                    </button>
                    <button type="button" onClick={() => confirm('Delete permanently?') && deleteNote(n)} style={{ marginLeft: 8, background: 'crimson' }}>
                      <Codicon name="trash" size={14} /> Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {tab === 'files' && (
        <>
          {files.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No archived files.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map((f) => (
                <li key={f.id} className="list-item">
                  <span>{f.name}</span>
                  <span>
                    <button type="button" className="secondary" onClick={() => restoreFile(f)}>
                      <Codicon name="unarchive" size={14} /> Restore
                    </button>
                    <button type="button" onClick={() => confirm('Delete permanently?') && deleteFile(f)} style={{ marginLeft: 8, background: 'crimson' }}>
                      <Codicon name="trash" size={14} /> Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {tab === 'folders' && (
        <>
          {folders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No archived folders.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {folders.map((f) => (
                <li key={f.id} className="list-item">
                  <span>{f.name}</span>
                  <span>
                    <button type="button" className="secondary" onClick={() => restoreFolder(f)}>
                      <Codicon name="unarchive" size={14} /> Restore
                    </button>
                    <button type="button" onClick={() => confirm('Delete permanently?') && deleteFolder(f)} style={{ marginLeft: 8, background: 'crimson' }}>
                      <Codicon name="trash" size={14} /> Delete
                    </button>
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
