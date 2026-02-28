import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownPreview from '../components/MarkdownPreview';
import type { NoteWithDirty } from '@gopx-drive/core';
const AUTOSAVE_MS = 2000;

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, cache, syncService } = useAuth();
  const isNew = id === 'new';
  const [note, setNote] = useState<NoteWithDirty | null | undefined>(isNew ? null : undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      setNote(null);
      setTitle('');
      setContent('');
      return;
    }
    let cancelled = false;
    cache.getNoteById(id!).then((n) => {
      if (!cancelled) {
        setNote(n ?? null);
        if (n) {
          setTitle(n.title ?? '');
          setContent(n.content ?? '');
        }
      }
    });
    return () => { cancelled = true; };
  }, [id, isNew, cache]);

  const saveToCache = useCallback(
    async (patch: { title?: string; content?: string }) => {
      if (isNew) {
        if (!user) return;
        const newNote: NoteWithDirty = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: patch.title ?? title,
          content: patch.content ?? content,
          folder_id: null,
          is_archived: false,
          share_token: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          dirty: true,
        };
        await cache.upsertNote(newNote);
        await cache.addPendingOp({ type: 'note_create', payload: newNote });
        setNote(newNote);
        navigate(`/notes/${newNote.id}`, { replace: true });
        return;
      }
      if (!note) return;
      const updated = { ...note, ...patch, updated_at: new Date().toISOString(), dirty: true };
      await cache.upsertNote(updated);
      await cache.addPendingOp({ type: 'note_update', id: note.id, payload: patch });
      setNote(updated);
    },
    [isNew, user, note, title, content, cache, navigate]
  );

  useEffect(() => {
    if (isNew || !note) return;
    const t = setTimeout(() => {
      if (title !== (note.title ?? '') || content !== note.content) {
        setSaving(true);
        saveToCache({ title: title || undefined, content }).then(() => setSaving(false));
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [title, content, note, isNew, saveToCache]);

  const handleShare = async () => {
    if (!note) return;
    const token = note.share_token ?? crypto.randomUUID().replace(/-/g, '');
    await cache.upsertNote({ ...note, share_token: token, updated_at: new Date().toISOString(), dirty: true });
    await cache.addPendingOp({ type: 'note_update', id: note.id, payload: { share_token: token } });
    setNote((n) => (n ? { ...n, share_token: token } : null));
    setShareUrl(`${window.location.origin}/share/${token}`);
    if (syncService.isOnline()) syncService.sync().catch(() => {});
  };

  const handleUnshare = async () => {
    if (!note) return;
    await cache.upsertNote({ ...note, share_token: null, updated_at: new Date().toISOString(), dirty: true });
    await cache.addPendingOp({ type: 'note_update', id: note.id, payload: { share_token: undefined } });
    setNote((n) => (n ? { ...n, share_token: null } : null));
    setShareUrl(null);
  };

  const handleSave = () => {
    setSaving(true);
    saveToCache({ title: title || undefined, content }).then(() => setSaving(false));
  };

  if (!isNew && note === undefined) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className="secondary" onClick={() => navigate(-1)}>
          <Codicon name="arrow-left" size={16} /> Back
        </button>
        <button type="button" onClick={handleSave} disabled={saving}>
          <Codicon name="save" size={16} /> {saving ? 'Saving...' : 'Save note'}
        </button>
        {saving && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saving...</span>}
      </div>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !isNew && note && saveToCache({ title: title || undefined })}
        style={{ width: '100%', marginBottom: 8, fontSize: '1.25rem' }}
      />
      <div className="note-editor-split">
        <div className="note-editor-pane">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Codicon name="edit" size={12} /> Edit
        </div>
          <MarkdownEditor value={content} onChange={setContent} minHeight="400px" />
        </div>
        <div className="note-preview-pane">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Codicon name="eye" size={12} /> Preview
        </div>
          <div className="note-preview">
            <MarkdownPreview content={content} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="secondary" onClick={note?.share_token ? handleUnshare : handleShare}>
          {note?.share_token ? <><Codicon name="remove" size={16} /> Revoke share link</> : <><Codicon name="share" size={16} /> Get share link</>}
        </button>
        {shareUrl && (
          <span style={{ fontSize: 14 }}>
            Share URL: <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
          </span>
        )}
      </div>
    </div>
  );
}
