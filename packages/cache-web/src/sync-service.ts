import type { ApiClient, SyncCache, SyncService, NoteWithDirty, Note } from '@gopx-drive/core';

export function createSyncService(api: ApiClient, cache: SyncCache): SyncService {
  return {
    isOnline(): boolean {
      return typeof navigator !== 'undefined' && navigator.onLine;
    },

    async sync(): Promise<{ error: Error | null }> {
      if (!this.isOnline()) return { error: new Error('Offline') };

      try {
        // Push: dirty notes to Supabase
        const notes = await cache.getNotes();
        for (const note of notes) {
          if (note.dirty) {
            const existing = await api.getNoteById(note.id);
            if (existing) {
              const { error } = await api.updateNote(note.id, {
                title: note.title,
                content: note.content,
                folder_id: note.folder_id,
                is_archived: note.is_archived,
                share_token: note.share_token,
                updated_at: note.updated_at,
              });
              if (!error) await cache.setNoteDirty(note.id, false);
            } else {
              const { data, error } = await api.createNote({
                id: note.id,
                user_id: note.user_id,
                title: note.title,
                content: note.content,
                folder_id: note.folder_id,
                is_archived: note.is_archived,
                share_token: note.share_token,
              });
              if (!error && data) await cache.setNoteDirty(note.id, false);
            }
          }
        }

        // Push: replay pending ops (always remove from index 0 after success)
        let pending = await cache.getPendingOps();
        while (pending.length > 0) {
          const op = pending[0];
          let ok = true;
          if (op.type === 'folder_create') {
            const { data, error } = await api.createFolder(op.payload.name);
            if (!error && data) await cache.upsertFolder(data);
            else ok = false;
          } else if (op.type === 'folder_update') {
            const { error } = await api.updateFolder(op.id, op.payload);
            ok = !error;
          } else if (op.type === 'folder_delete') {
            const { error } = await api.deleteFolder(op.id);
            ok = !error;
          } else if (op.type === 'note_create') {
            const { data, error } = await api.createNote(op.payload);
            if (!error && data) await cache.upsertNote({ ...data, dirty: false });
            else ok = false;
          } else if (op.type === 'note_update') {
            const { error } = await api.updateNote(op.id, op.payload);
            if (!error) {
              const existing = await cache.getNoteById(op.id);
              if (existing) await cache.upsertNote({ ...existing, ...op.payload, dirty: false });
            } else ok = false;
          } else if (op.type === 'note_delete') {
            const { error } = await api.deleteNote(op.id);
            if (!error) await cache.deleteNote(op.id);
            ok = !error;
          } else if (op.type === 'file_create') {
            const { data, error } = await api.createFileRecord(op.payload);
            if (!error && data) await cache.upsertFile(data);
            else ok = false;
          } else if (op.type === 'file_update') {
            const { error } = await api.updateFileRecord(op.id, op.payload);
            ok = !error;
          } else if (op.type === 'file_delete') {
            const { error } = await api.deleteFileRecord(op.id);
            if (op.storagePath) await api.deleteFileStorage(op.storagePath);
            if (!error) await cache.deleteFile(op.id);
            ok = !error;
          } else if (op.type === 'event_create') {
            const { data, error } = await api.createEvent(op.payload);
            if (!error && data) await cache.upsertEvent(data);
            else ok = false;
          } else if (op.type === 'event_update') {
            const { error } = await api.updateEvent(op.id, op.payload);
            ok = !error;
          } else if (op.type === 'event_delete') {
            const { error } = await api.deleteEvent(op.id);
            if (!error) await cache.deleteEvent(op.id);
            ok = !error;
          }
          if (ok) await cache.clearPendingOp(0);
          pending = await cache.getPendingOps();
        }

        // Pull: fetch from Supabase and replace cache
        const [remoteNotes, remoteFolders, remoteFiles, remoteEvents] = await Promise.all([
          api.getNotes(),
          api.getFolders(),
          api.getFiles(),
          api.getEvents(),
        ]);
        const notesWithDirty: NoteWithDirty[] = remoteNotes.map((n: Note) => ({ ...n, dirty: false }));
        await cache.replaceNotes(notesWithDirty);
        await cache.replaceFolders(remoteFolders);
        await cache.replaceFiles(remoteFiles);
        await cache.replaceEvents(remoteEvents);

        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
  };
}
