import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Codicon from '../components/Codicon';
import MarkdownEditor, { TOOLBAR_BUTTONS, type MarkdownEditorHandle } from '../components/MarkdownEditor';
import MarkdownPreview from '../components/MarkdownPreview';
import DocumentOutline from '../components/DocumentOutline';
import type { NoteWithDirty } from '@gopx-drive/core';

const AUTOSAVE_MS = 2000;

export default function NoteEditorObsidian() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, cache, syncService } = useAuth();
  const isNew = id === 'new';
  const [note, setNote] = useState<NoteWithDirty | null | undefined>(isNew ? null : undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('preview');
  const editorRef = useRef<MarkdownEditorHandle>(null);

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

  const handleSave = async () => {
    setSaving(true);
    await saveToCache({ title: title || undefined, content });
    setSaving(false);
    if (syncService.isOnline()) syncService.sync().catch(() => {});
  };

  if (!isNew && note === undefined) return <div className="obsidian-loading">Loading...</div>;

  return (
    <div className="obsidian-editor-layout">
      {/* Notes header bar: save, preview toggle, toolbar */}
      <header className="obsidian-notes-header">
        <div className="obsidian-notes-header-left">
          <button
            type="button"
            className="obsidian-icon-btn"
            title="Save"
            onClick={handleSave}
            disabled={saving}
          >
            <Codicon name="check" size={18} />
          </button>
          <button
            type="button"
            className="obsidian-icon-btn"
            title={previewMode === 'edit' ? 'Preview' : 'Edit'}
            onClick={() => setPreviewMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
          >
            <Codicon name={previewMode === 'edit' ? 'preview' : 'edit'} size={18} />
          </button>
          <button
            type="button"
            className="obsidian-icon-btn"
            title={showOutline ? 'Hide outline' : 'Show outline'}
            onClick={() => setShowOutline(!showOutline)}
          >
            <Codicon name="split-horizontal" size={18} />
          </button>
        </div>
        {previewMode === 'edit' && (
          <div className="obsidian-notes-header-toolbar">
            {TOOLBAR_BUTTONS.map(({ cmd, icon, title }) => (
              <button
                key={cmd}
                type="button"
                className="obsidian-icon-btn"
                title={title}
                onClick={() => editorRef.current?.runCommand(cmd)}
              >
                <Codicon name={icon} size={16} />
              </button>
            ))}
          </div>
        )}
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
          <div className="obsidian-editor-area obsidian-editor-area-single">
            {previewMode === 'edit' ? (
              <div className="obsidian-editor-pane">
                <MarkdownEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  minHeight="500px"
                  showToolbar={false}
                />
              </div>
            ) : (
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
    </div>
  );
}
