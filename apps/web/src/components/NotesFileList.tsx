import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from './Codicon';
import type { NoteWithDirty } from '@gopx-drive/core';

export default function NotesFileList() {
  const { cache } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [notes, setNotes] = useState<NoteWithDirty[]>([]);

  useEffect(() => {
    let cancelled = false;
    cache.getNotes().then((n) => {
      if (!cancelled) setNotes(n.filter((x) => !x.is_archived));
    });
    return () => { cancelled = true; };
  }, [cache]);

  const currentNoteId = id && id !== 'new' ? id : null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="notes-file-list">
      <div className="notes-file-list-header">
        <div className="notes-file-list-toolbar">
          <button type="button" className="obsidian-icon-btn" title="Edit">
            <Codicon name="edit" size={16} />
          </button>
          <Link to="/notes/new" className="obsidian-icon-btn" title="New note">
            <Codicon name="add" size={16} />
          </Link>
          <button type="button" className="obsidian-icon-btn" title="Upload">
            <Codicon name="file-media" size={16} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Sort">
            <Codicon name="sort-precedence" size={16} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Move up">
            <Codicon name="arrow-up" size={16} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Move down">
            <Codicon name="arrow-down" size={16} />
          </button>
        </div>
        <span className="notes-file-list-date">{today}</span>
      </div>
      <div className="notes-file-list-items">
        {notes.map((n) => (
          <Link
            key={n.id}
            to={`/notes/${n.id}`}
            className={`notes-file-item ${currentNoteId === n.id ? 'active' : ''}`}
          >
            <span className="notes-file-title">{n.title || 'Untitled'}</span>
            {n.folder_id && <span className="notes-file-badge">CANVAS</span>}
          </Link>
        ))}
        {notes.length === 0 && (
          <div className="notes-file-empty">
            <p>No notes yet</p>
            <Link to="/notes/new" className="notes-new-link">
              Create your first note
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
