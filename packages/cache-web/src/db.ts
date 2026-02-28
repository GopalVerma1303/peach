import { openDB, type IDBPDatabase } from 'idb';
import type { Folder, NoteWithDirty, FileRecord, EventRecord } from '@gopx-drive/core';
import type { PendingOp } from '@gopx-drive/core';

const DB_NAME = 'gopx-drive-cache';
const DB_VERSION = 1;

export interface DBSchema {
  notes: { key: string; value: NoteWithDirty };
  folders: { key: string; value: Folder };
  files: { key: string; value: FileRecord };
  events: { key: string; value: EventRecord };
  pending_ops: { key: number; value: PendingOp };
}

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<DBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_ops')) {
          db.createObjectStore('pending_ops', { keyPath: 'key', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}
