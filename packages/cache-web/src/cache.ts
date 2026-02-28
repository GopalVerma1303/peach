import type { SyncCache, PendingOp } from '@gopx-drive/core';
import type { Folder, NoteWithDirty, FileRecord, EventRecord } from '@gopx-drive/core';
import { getDB } from './db.js';

export function createIndexedDBCache(): SyncCache {
  return {
    async getNotes() {
      const db = await getDB();
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const all = await store.getAll();
      await tx.done;
      return all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    async getNoteById(id: string) {
      const db = await getDB();
      return (await db.get('notes', id)) ?? null;
    },
    async upsertNote(note: NoteWithDirty) {
      const db = await getDB();
      await db.put('notes', { ...note, dirty: note.dirty ?? false });
    },
    async setNoteDirty(id: string, dirty: boolean) {
      const db = await getDB();
      const note = await db.get('notes', id);
      if (note) await db.put('notes', { ...note, dirty });
    },
    async deleteNote(id: string) {
      const db = await getDB();
      await db.delete('notes', id);
    },

    async getFolders() {
      const db = await getDB();
      const all = await db.getAll('folders');
      return all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    async upsertFolder(folder: Folder) {
      const db = await getDB();
      await db.put('folders', folder);
    },
    async deleteFolder(id: string) {
      const db = await getDB();
      await db.delete('folders', id);
    },

    async getFiles() {
      const db = await getDB();
      const all = await db.getAll('files');
      return all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },
    async upsertFile(file: FileRecord) {
      const db = await getDB();
      await db.put('files', file);
    },
    async deleteFile(id: string) {
      const db = await getDB();
      await db.delete('files', id);
    },

    async getEvents() {
      const db = await getDB();
      const all = await db.getAll('events');
      return all.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    },
    async upsertEvent(event: EventRecord) {
      const db = await getDB();
      await db.put('events', event);
    },
    async deleteEvent(id: string) {
      const db = await getDB();
      await db.delete('events', id);
    },

    async getPendingOps() {
      const db = await getDB();
      const all = await db.getAll('pending_ops');
      return all.map((v) => v as unknown as PendingOp);
    },
    async addPendingOp(op: PendingOp) {
      const db = await getDB();
      await db.add('pending_ops', op);
    },
    async clearPendingOp(index: number) {
      const db = await getDB();
      const keys = await db.getAllKeys('pending_ops');
      const key = keys[index];
      if (key !== undefined) await db.delete('pending_ops', key);
    },
    async clearAllPendingOps() {
      const db = await getDB();
      await db.clear('pending_ops');
    },

    async replaceNotes(notes: NoteWithDirty[]) {
      const db = await getDB();
      const tx = db.transaction('notes', 'readwrite');
      await tx.objectStore('notes').clear();
      for (const n of notes) await tx.objectStore('notes').put({ ...n, dirty: n.dirty ?? false });
      await tx.done;
    },
    async replaceFolders(folders: Folder[]) {
      const db = await getDB();
      const tx = db.transaction('folders', 'readwrite');
      await tx.objectStore('folders').clear();
      for (const f of folders) await tx.objectStore('folders').put(f);
      await tx.done;
    },
    async replaceFiles(files: FileRecord[]) {
      const db = await getDB();
      const tx = db.transaction('files', 'readwrite');
      await tx.objectStore('files').clear();
      for (const f of files) await tx.objectStore('files').put(f);
      await tx.done;
    },
    async replaceEvents(events: EventRecord[]) {
      const db = await getDB();
      const tx = db.transaction('events', 'readwrite');
      await tx.objectStore('events').clear();
      for (const e of events) await tx.objectStore('events').put(e);
      await tx.done;
    },

    async clear() {
      const db = await getDB();
      await Promise.all([
        db.clear('notes'),
        db.clear('folders'),
        db.clear('files'),
        db.clear('events'),
        db.clear('pending_ops'),
      ]);
    },
  };
}
