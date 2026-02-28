/** Domain types for gopx-drive. Supabase is source of truth; clients cache these locally. */

export type RepeatInterval = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  folder_id: string | null;
  is_archived: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

/** Local-only: set by cache layer for sync state */
export interface NoteWithDirty extends Note {
  dirty?: boolean;
}

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  extension: string;
  folder_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  repeat_interval: RepeatInterval | null;
  created_at: string;
  updated_at: string;
}

export interface AttachmentInfo {
  id?: string;
  file_path: string;
  user_id?: string;
  public_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export type ViewMode = 'list' | 'grid';
export type Theme = 'light' | 'dark' | 'system';

export interface Preferences {
  theme: Theme;
  view_mode_home: ViewMode;
  view_mode_notes: ViewMode;
  view_mode_files: ViewMode;
  view_mode_folders: ViewMode;
  view_mode_attachments: ViewMode;
  toolbar_order?: string[];
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  view_mode_home: 'list',
  view_mode_notes: 'list',
  view_mode_files: 'list',
  view_mode_folders: 'list',
  view_mode_attachments: 'grid',
  toolbar_order: [],
};
