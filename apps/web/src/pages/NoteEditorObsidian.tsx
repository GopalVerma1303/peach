import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownPreview from '../components/MarkdownPreview';
import DocumentOutline from '../components/DocumentOutline';
import type { NoteWithDirty } from '@gopx-drive/core';

const AUTOSAVE_MS = 2000;

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function NoteEditorObsidian() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, cache, syncService } = useAuth();
  const isNew = id === 'new';
  const [note, setNote] = useState<NoteWithDirty | null | undefined>(isNew ? null : undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showOutline, setShowOutline] = useState(true);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'split'>('split');

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

  const displayTitle = title || 'Untitled';
  const wordCount = useMemo(() => countWords(content), [content]);
  const charCount = useMemo(() => content.length, [content]);

  if (!isNew && note === undefined) return <div className="obsidian-loading">Loading...</div>;

  return (
    <div className="obsidian-editor-layout">
      {/* Top bar */}
      <header className="obsidian-topbar">
        <div className="obsidian-topbar-left">
          <button type="button" className="obsidian-icon-btn" title="New note" onClick={() => navigate('/notes/new')}>
            <Codicon name="add" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Folder">
            <Codicon name="folder" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Table">
            <Codicon name="table" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Image">
            <Codicon name="file-media" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Split view">
            <Codicon name="split-horizontal" size={18} onClick={() => setPreviewMode('split')} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Preview">
            <Codicon name="preview" size={18} onClick={() => setPreviewMode('preview')} />
          </button>
        </div>
        <div className="obsidian-topbar-center">
          <button type="button" className="obsidian-icon-btn" onClick={() => navigate(-1)} title="Back">
            <Codicon name="arrow-left" size={16} />
          </button>
          <button type="button" className="obsidian-icon-btn" onClick={() => navigate(1)} title="Forward">
            <Codicon name="arrow-right" size={16} />
          </button>
          <span className="obsidian-doc-title">{displayTitle}</span>
        </div>
        <div className="obsidian-topbar-right">
          <button type="button" className="obsidian-icon-btn" title="Menu">
            <Codicon name="ellipsis" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Search">
            <Codicon name="search" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Split" onClick={() => setShowOutline(!showOutline)}>
            <Codicon name="split-horizontal" size={18} />
          </button>
          <button type="button" className="obsidian-icon-btn" title="Close">
            <Codicon name="close" size={18} />
          </button>
        </div>
      </header>

      {/* Main content + right outline */}
      <div className="obsidian-content-wrapper">
        <main className="obsidian-main-content">
          <div className="obsidian-doc-header">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !isNew && note && saveToCache({ title: title || undefined })}
              className="obsidian-doc-title-large"
              placeholder="Untitled"
            />
          </div>
          <div className="obsidian-editor-area">
            {previewMode !== 'preview' && (
              <div className="obsidian-editor-pane">
                <MarkdownEditor value={content} onChange={setContent} minHeight="500px" />
              </div>
            )}
            {previewMode !== 'edit' && (
              <div className="obsidian-preview-pane">
                <div className="obsidian-preview-inner">
                  <MarkdownPreview content={content} />
                </div>
              </div>
            )}
          </div>
        </main>

        {showOutline && (
          <aside className="obsidian-sidebar-right">
            <DocumentOutline content={content} />
          </aside>
        )}
      </div>

      {/* Bottom status bar */}
      <footer className="obsidian-statusbar">
        <div className="obsidian-statusbar-left">
          <span>0 backlinks</span>
          <button type="button" className="obsidian-icon-btn" title="Edit">
            <Codicon name="edit" size={14} />
          </button>
        </div>
        <div className="obsidian-statusbar-center">
          <span>
            {wordCount} words {charCount.toLocaleString()} characters
          </span>
        </div>
        <div className="obsidian-statusbar-right">
          {saving && <span className="obsidian-saving">Saving...</span>}
          {note?.share_token ? (
            <button type="button" className="obsidian-icon-btn" onClick={handleUnshare} title="Revoke share">
              <Codicon name="remove" size={14} />
            </button>
          ) : (
            <button type="button" className="obsidian-icon-btn" onClick={handleShare} title="Share">
              <Codicon name="share" size={14} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
