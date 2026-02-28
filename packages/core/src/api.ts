import type { SupabaseClientType } from './supabase.js';
import type { Folder, Note, FileRecord, EventRecord } from './types.js';
import { BUCKET_FILES, BUCKET_ATTACHMENTS } from './supabase.js';

export interface ApiClient {
  // Auth
  signUp(email: string, password: string): Promise<{ error: Error | null }>;
  signIn(email: string, password: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ user: { id: string; email?: string } | null }>;

  // Folders
  getFolders(): Promise<Folder[]>;
  createFolder(name: string): Promise<{ data: Folder | null; error: Error | null }>;
  updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'is_archived'>>): Promise<{ error: Error | null }>;
  deleteFolder(id: string): Promise<{ error: Error | null }>;

  // Notes
  getNotes(): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  getNoteByShareToken(token: string): Promise<Note | null>;
  createNote(note: Partial<Note>): Promise<{ data: Note | null; error: Error | null }>;
  updateNote(id: string, patch: Partial<Note>): Promise<{ error: Error | null }>;
  deleteNote(id: string): Promise<{ error: Error | null }>;

  // Files (metadata + storage)
  getFiles(): Promise<FileRecord[]>;
  createFileRecord(record: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: FileRecord | null; error: Error | null }>;
  uploadFile(userId: string, path: string, file: File | Blob): Promise<{ error: Error | null }>;
  getFileUrl(path: string): Promise<string | null>;
  updateFileRecord(id: string, patch: Partial<FileRecord>): Promise<{ error: Error | null }>;
  deleteFileRecord(id: string): Promise<{ error: Error | null }>;
  deleteFileStorage(path: string): Promise<{ error: Error | null }>;

  // Events
  getEvents(): Promise<EventRecord[]>;
  createEvent(event: Omit<EventRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: EventRecord | null; error: Error | null }>;
  updateEvent(id: string, patch: Partial<EventRecord>): Promise<{ error: Error | null }>;
  deleteEvent(id: string): Promise<{ error: Error | null }>;

  // Attachments
  uploadAttachment(userId: string, path: string, file: File | Blob): Promise<{ error: Error | null }>;
  getAttachmentUrl(path: string): Promise<string | null>;
  deleteAttachment(path: string): Promise<{ error: Error | null }>;
  listAttachmentPaths(userId: string): Promise<string[]>;
}

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error(String(e));
}

export function createSupabaseApi(supabase: SupabaseClientType): ApiClient {
  return {
    async signUp(email: string, password: string) {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ? toError(error) : null };
    },
    async signIn(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? toError(error) : null };
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return { user: data.session?.user ? { id: data.session.user.id, email: data.session.user.email ?? undefined } : null };
    },

    async getFolders() {
      const { data, error } = await supabase.from('folders').select('*').order('updated_at', { ascending: false });
      if (error) throw toError(error);
      return (data ?? []) as Folder[];
    },
    async createFolder(name: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: new Error('Not authenticated') };
      const row = { user_id: user.id, name, is_archived: false };
      const { data, error } = await supabase.from('folders').insert(row).select().single();
      return { data: data as Folder | null, error: error ? toError(error) : null };
    },
    async updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'is_archived'>>) {
      const { error } = await supabase.from('folders').update(patch).eq('id', id);
      return { error: error ? toError(error) : null };
    },
    async deleteFolder(id: string) {
      const { error } = await supabase.from('folders').delete().eq('id', id);
      return { error: error ? toError(error) : null };
    },

    async getNotes() {
      const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
      if (error) throw toError(error);
      return (data ?? []) as Note[];
    },
    async getNoteById(id: string) {
      const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
      if (error) return null;
      return data as Note;
    },
    async getNoteByShareToken(token: string) {
      const { data, error } = await supabase.rpc('get_shared_note', { token });
      if (error || !data?.length) return null;
      return data[0] as Note;
    },
    async createNote(note: Partial<Note>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: new Error('Not authenticated') };
      const row = {
        user_id: user.id,
        title: note.title ?? null,
        content: note.content ?? '',
        folder_id: note.folder_id ?? null,
        is_archived: note.is_archived ?? false,
        share_token: note.share_token ?? null,
      };
      const { data, error } = await supabase.from('notes').insert(row).select().single();
      return { data: data as Note | null, error: error ? toError(error) : null };
    },
    async updateNote(id: string, patch: Partial<Note>) {
      const { error } = await supabase.from('notes').update(patch).eq('id', id);
      return { error: error ? toError(error) : null };
    },
    async deleteNote(id: string) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      return { error: error ? toError(error) : null };
    },

    async getFiles() {
      const { data, error } = await supabase.from('files').select('*').order('updated_at', { ascending: false });
      if (error) throw toError(error);
      return (data ?? []) as FileRecord[];
    },
    async createFileRecord(record: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase.from('files').insert(record).select().single();
      return { data: data as FileRecord | null, error: error ? toError(error) : null };
    },
    async uploadFile(userId: string, path: string, file: File | Blob) {
      const { error } = await supabase.storage.from(BUCKET_FILES).upload(`${userId}/${path}`, file, { upsert: true });
      return { error: error ? toError(error) : null };
    },
    async getFileUrl(path: string) {
      const { data } = await supabase.storage.from(BUCKET_FILES).getPublicUrl(path);
      return data.publicUrl;
    },
    async updateFileRecord(id: string, patch: Partial<FileRecord>) {
      const { error } = await supabase.from('files').update(patch).eq('id', id);
      return { error: error ? toError(error) : null };
    },
    async deleteFileRecord(id: string) {
      const { error } = await supabase.from('files').delete().eq('id', id);
      return { error: error ? toError(error) : null };
    },
    async deleteFileStorage(path: string) {
      const { error } = await supabase.storage.from(BUCKET_FILES).remove([path]);
      return { error: error ? toError(error) : null };
    },

    async getEvents() {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (error) throw toError(error);
      return (data ?? []) as EventRecord[];
    },
    async createEvent(event: Omit<EventRecord, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase.from('events').insert(event).select().single();
      return { data: data as EventRecord | null, error: error ? toError(error) : null };
    },
    async updateEvent(id: string, patch: Partial<EventRecord>) {
      const { error } = await supabase.from('events').update(patch).eq('id', id);
      return { error: error ? toError(error) : null };
    },
    async deleteEvent(id: string) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      return { error: error ? toError(error) : null };
    },

    async uploadAttachment(userId: string, path: string, file: File | Blob) {
      const { error } = await supabase.storage.from(BUCKET_ATTACHMENTS).upload(`${userId}/${path}`, file, { upsert: true });
      return { error: error ? toError(error) : null };
    },
    async getAttachmentUrl(path: string) {
      const { data } = await supabase.storage.from(BUCKET_ATTACHMENTS).getPublicUrl(path);
      return data.publicUrl;
    },
    async deleteAttachment(path: string) {
      const { error } = await supabase.storage.from(BUCKET_ATTACHMENTS).remove([path]);
      return { error: error ? toError(error) : null };
    },
    async listAttachmentPaths(userId: string) {
      const { data, error } = await supabase.storage.from(BUCKET_ATTACHMENTS).list(userId, { limit: 1000 });
      if (error) return [];
      const paths: string[] = [];
      for (const item of data ?? []) {
        if (item.name) paths.push(`${userId}/${item.name}`);
      }
      return paths;
    },
  };
}
