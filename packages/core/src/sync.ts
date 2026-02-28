import type { Folder, Note, NoteWithDirty, FileRecord, EventRecord } from './types.js';

/** Pending operation for replay when online */
export type PendingOp =
  | { type: 'folder_create'; payload: { name: string } }
  | { type: 'folder_update'; id: string; payload: Partial<Pick<Folder, 'name' | 'is_archived'>> }
  | { type: 'folder_delete'; id: string }
  | { type: 'note_create'; payload: Partial<Note> }
  | { type: 'note_update'; id: string; payload: Partial<Note> }
  | { type: 'note_delete'; id: string }
  | { type: 'file_create'; payload: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'> }
  | { type: 'file_update'; id: string; payload: Partial<FileRecord> }
  | { type: 'file_delete'; id: string; storagePath?: string }
  | { type: 'event_create'; payload: Omit<EventRecord, 'id' | 'created_at' | 'updated_at'> }
  | { type: 'event_update'; id: string; payload: Partial<EventRecord> }
  | { type: 'event_delete'; id: string };

/** Cache + sync layer: UI reads/writes through this. Implement per platform (IndexedDB, SQLite, etc.). */
export interface SyncCache {
  // Notes (with dirty flag for sync)
  getNotes(): Promise<NoteWithDirty[]>;
  getNoteById(id: string): Promise<NoteWithDirty | null>;
  upsertNote(note: NoteWithDirty): Promise<void>;
  setNoteDirty(id: string, dirty: boolean): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Folders
  getFolders(): Promise<Folder[]>;
  upsertFolder(folder: Folder): Promise<void>;
  deleteFolder(id: string): Promise<void>;

  // Files
  getFiles(): Promise<FileRecord[]>;
  upsertFile(file: FileRecord): Promise<void>;
  deleteFile(id: string): Promise<void>;

  // Events
  getEvents(): Promise<EventRecord[]>;
  upsertEvent(event: EventRecord): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  // Pending queue (replay to API when online)
  getPendingOps(): Promise<PendingOp[]>;
  addPendingOp(op: PendingOp): Promise<void>;
  clearPendingOp(index: number): Promise<void>;
  clearAllPendingOps(): Promise<void>;

  // Bulk replace (after pull from Supabase)
  replaceNotes(notes: NoteWithDirty[]): Promise<void>;
  replaceFolders(folders: Folder[]): Promise<void>;
  replaceFiles(files: FileRecord[]): Promise<void>;
  replaceEvents(events: EventRecord[]): Promise<void>;

  // Clear all (e.g. on sign out)
  clear(): Promise<void>;
}

export interface SyncService {
  /** Run push (dirty notes + pending queue) then pull. Call on start and when online. */
  sync(): Promise<{ error: Error | null }>;
  /** Whether we think we're online */
  isOnline(): boolean;
}
