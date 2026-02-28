import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import type { NoteWithDirty } from '@gopx-drive/core';

export default function NotesList() {
  const { cache } = useAuth();
  const [notes, setNotes] = useState<NoteWithDirty[]>([]);

  useEffect(() => {
    let cancelled = false;
    cache.getNotes().then((n) => {
      if (!cancelled) setNotes(n.filter((x) => !x.is_archived));
    });
    return () => { cancelled = true; };
  }, [cache]);

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Codicon name="file-text" size={24} /> Notes
      </h1>
      <p>
        <Link to="/notes/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Codicon name="add" size={16} /> New note
        </Link>
      </p>
      {notes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No notes.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {notes.map((n) => (
            <li key={n.id} className="list-item">
              <Link to={`/notes/${n.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Codicon name="file-text" size={16} style={{ flexShrink: 0, opacity: 0.7 }} /> {n.title || 'Untitled'}
              </Link>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {n.dirty ? 'Unsynced' : ''} {new Date(n.updated_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
