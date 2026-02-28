import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { NoteWithDirty, FileRecord, EventRecord, Folder } from '@gopx-drive/core';

export default function Home() {
  const { cache, syncService } = useAuth();
  const [notes, setNotes] = useState<NoteWithDirty[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, f, e, fo] = await Promise.all([
        cache.getNotes(),
        cache.getFiles(),
        cache.getEvents(),
        cache.getFolders(),
      ]);
      if (cancelled) return;
      const rootNotes = n.filter((x) => !x.folder_id && !x.is_archived).slice(0, 10);
      const rootFiles = f.filter((x) => !x.folder_id && !x.is_archived).slice(0, 10);
      const upcoming = e
        .filter((x) => new Date(x.event_date) >= new Date())
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 5);
      setNotes(rootNotes);
      setFiles(rootFiles);
      setEvents(upcoming);
      setFolders(fo.filter((x) => !x.is_archived));
    })();
    return () => { cancelled = true; };
  }, [cache]);

  useEffect(() => {
    if (syncService.isOnline()) syncService.sync().catch(() => {});
  }, [syncService]);

  return (
    <div>
      <h1>Home</h1>
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="file-text" size={20} /> Recent notes
        </h2>
        {notes.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notes yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notes.map((n) => (
              <li key={n.id} className="list-item">
                <Link to={`/notes/${n.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Codicon name="file-text" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {n.title || 'Untitled'}
                </Link>
                {n.dirty && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unsynced</span>}
              </li>
            ))}
          </ul>
        )}
        <Link to="/notes/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Codicon name="add" size={16} /> New note
        </Link>
      </section>
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="file" size={20} /> Files
        </h2>
        {files.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No files yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {files.map((f) => (
              <li key={f.id} className="list-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Codicon name="file" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {f.name}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/files" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Codicon name="link-external" size={16} /> View all / Upload
        </Link>
      </section>
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="calendar" size={20} /> Upcoming events
        </h2>
        {events.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No upcoming events.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {events.map((e) => (
              <li key={e.id} className="list-item">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Codicon name="calendar" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {e.title}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  {new Date(e.event_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/calendar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Codicon name="link-external" size={16} /> Calendar
        </Link>
      </section>
      <section className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Codicon name="folder-opened" size={20} /> Folders
        </h2>
        {folders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No folders yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {folders.map((f) => (
              <li key={f.id} className="list-item">
                <Link to={`/folders/${f.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Codicon name="folder-opened" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {f.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/folders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Codicon name="link-external" size={16} /> Manage folders
        </Link>
      </section>
    </div>
  );
}
