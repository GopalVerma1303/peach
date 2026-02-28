import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Folder, Note, FileRecord, EventRecord } from './types.js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? process?.env?.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? process?.env?.VITE_SUPABASE_ANON_KEY ?? '';

export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export type SupabaseClientType = ReturnType<typeof createSupabaseClient>;

/** Database schema types for Supabase generated types (optional, for strict typing) */
export interface Database {
  public: {
    Tables: {
      folders: { Row: Folder; Insert: Omit<Folder, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Folder> };
      notes: { Row: Note; Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<Note> };
      files: { Row: FileRecord; Insert: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<FileRecord> };
      events: { Row: EventRecord; Insert: Omit<EventRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }; Update: Partial<EventRecord> };
    };
  };
}

export const BUCKET_FILES = 'files';
export const BUCKET_ATTACHMENTS = 'attachments';
