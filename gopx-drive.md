# gopx-drive – System Specification for Obsidian-style Reimplementation

> High-level product and technical description of the existing `gopx-drive` app, written so another AI agent can rebuild a similar application using an Obsidian-like tech stack (Electron + TypeScript + CodeMirror-based Markdown editor). **Backend is Supabase** (source of truth); the app uses **aggressive caching** on all platforms to deliver a **local-first feel** without relying on a local file vault.

---

## 1. Target Tech Stack (Obsidian-style)

This section tells the next AI **what platform to target**, independent of the current React Native implementation.

### Key differentiator: Desktop + Web + Mobile

**Our app must ship on all three: desktop, web, and mobile.** This is a core product differentiator from Obsidian, which is primarily desktop (Electron) and mobile native apps and does not offer a full, first-class web application. The reimplementation must support:

- **Desktop** – Native-like app (e.g. Electron or Tauri) for Windows, macOS, Linux.
- **Web** – A full-featured web app that runs in the browser (no install required), with the same core features as desktop and mobile. Users can access their notes, files, folders, calendar, and settings from any device via a URL. Data is stored in Supabase; the web client uses caching (e.g. IndexedDB) for a local-first feel.
- **Mobile** – Native or native-shell apps for iOS and Android.

Feature parity and a consistent experience across desktop, web, and mobile are required. The web app is not a “lite” or read-only view; it is a first-class client.

---

- **Desktop runtime**
  - Electron-based (or similar) desktop app (Windows, macOS, Linux), mirroring how Obsidian ships on desktop.
  - Built with **TypeScript**, HTML, and CSS.
  - Data lives in **Supabase** (Postgres + Storage); the desktop client caches aggressively (e.g. local DB or IndexedDB) so the app feels local-first and works offline where possible.

- **Web runtime**
  - **First-class web application** that runs in the browser (Chrome, Firefox, Safari, Edge, etc.).
  - Same core feature set as desktop and mobile: notes, files, folders, calendar, archive, attachments, settings, AI tools, and public shared notes.
  - No install required; access via URL. Ideal for use on shared machines, quick access, or when the user cannot install the desktop app.
  - Data: **Supabase** is the backend. Use strong client-side caching (e.g. IndexedDB, service workers) so the web app feels local-first and works offline when possible; all clients sync via the same Supabase project.
  - Responsive layout: sidebar on large viewports, bottom nav or collapsible menu on smaller viewports, matching mobile UX where appropriate.
  - This is a **differentiator from Obsidian**, which does not provide a full web app.

- **Mobile runtime**
  - Mobile apps (iOS, Android) should reuse as much of the desktop/web UI logic as possible.
  - Implementation options (AI can choose, but the UX must match this spec):
    - Wrap the same TypeScript/HTML/CSS app in a mobile shell (similar to Obsidian mobile).
    - Or, use a thin native shell that embeds a WebView hosting the same Electron/web UI.
  - Mobile uses **Supabase** as the backend and caches data locally (e.g. SQLite, AsyncStorage) so the experience feels local-first and works offline when possible.

- **Editor / UI foundations**
  - Markdown editing powered by a **CodeMirror-based editor** (similar to Obsidian’s approach).
  - Live preview / hybrid editing: editable Markdown with inline formatting, checklists, links, etc.
  - File-tree style navigation on desktop (left sidebar), mobile-friendly bottom bar/top nav.

- **Data model and backend**
  - **Supabase is the source of truth** (Postgres for notes, folders, events, metadata; Storage for files and attachments). There is no local file vault; all persistent data lives in Supabase.
  - **Local-first feel** is achieved by **aggressive caching** on each client:
    - Notes, folders, files, events: cached locally (e.g. SQLite on native, IndexedDB on web) and refreshed from Supabase in the background.
    - Writes can be applied to the cache immediately and synced to Supabase when online; pending operations are queued and replayed on reconnect.
    - UI always prefers showing cached data; avoid spinners and refetch loops so the app feels instant and works offline where possible.
  - Domain entities: **notes** (Markdown in DB), **folders**, **files** (Storage + metadata in DB), **events**, **attachments** (Storage). See §3 for the full schema.

- **Plugin / extensibility (optional but recommended)**
  - Design the core in a way that could later be exposed as an **Obsidian plugin** or plugin-like module:
    - Core domain concepts (notes, folders, files, events, AI actions) should be accessible via a clean API surface.
    - UI should be decomposed into panes/views that could map to Obsidian “views” if embedded later.

For the rest of this document, assume the **behavioral spec is a hard requirement**, and the implementation details described here (current React Native + Supabase app) are a **helpful reference** for how things work today.

---

## 2. Product Overview

- **Purpose**
  - `gopx-drive` is a **Supabase-backed knowledge and file management app** that combines:
    - Markdown notes.
    - File uploads and previews.
    - Folder-based organization.
    - Calendar events.
    - Archiving and restore flows.
    - AI-assisted content generation inside notes.
  - The **backend is Supabase** (source of truth). The app uses **aggressive client-side caching** so it feels **local-first**: instant UI, offline-capable where possible, and no reliance on a local file vault. User edits are applied to the cache immediately and synced to Supabase in the background.

- **User model**
  - Single “user account” per app instance, backed by **Supabase Auth** (email/password).
  - Each piece of data (note, folder, file, event) is linked to a `user_id` in Supabase.
  - No multi-tenant support inside a single app instance unless intentionally added; all data is scoped to the signed-in user.

- **Top-level features**
  - **Desktop, web, and mobile apps** – Full-featured clients on all three platforms (web is a key differentiator from Obsidian; see §1).
  - Authentication and account state (login / sign-up / sign-out).
  - Home dashboard combining:
    - Recent/root notes.
    - Files.
    - Upcoming events.
    - Folders.
  - Notes listing and search.
  - Full note editor (Markdown + AI tools + attachments).
  - Files explorer with upload, preview, and archive.
  - Folder management and per-folder views (notes/files).
  - Archive (soft-delete) with restore and permanent delete.
  - Calendar/events with repeat rules.
  - Attachments management (storage bucket for images and other media).
  - Public shared-note link support.
  - Theme (light/dark/system) and layout customization.

---

## 3. Core Domain Model

This section describes the **logical data model**. The backend is **Supabase** (Postgres + Storage); clients cache this data locally for a local-first feel. The schema below is the source of truth in Supabase; cache layer may add fields like `dirty` for sync state.

### 3.1 User

- **Purpose**: Represents the account that owns the data in Supabase; used for auth and row-level scoping.
- **Key fields (conceptual)**
  - `id` (UUID/string): user ID.
  - `email`: used for login and identity on a remote service.
  - `created_at`, `updated_at`.
- **Notes**
  - Obsidian-like local mode may **not require login**; treat “user” as implicit, but preserve this concept if integrating with a sync backend.

### 3.2 Folder

- **Purpose**: Logical grouping of notes and files.
- **Fields**
  - `id`: unique identifier.
  - `user_id`: owner.
  - `name`: folder name (string).
  - `is_archived`: boolean flag for soft-delete/archive.
  - `created_at`, `updated_at`.
- **Behavior**
  - Folders can be **archived** and later restored.
  - Deleting a folder may be handled as:
    - Soft-delete (archive) in the first step.
    - Potential full delete; current implementation handles this carefully with cached/pending operations.
  - In this app:
    - Folders are **rows in Supabase** (no file-system directories). The UI presents them as a tree/list; archive state is a column (`is_archived`).

### 3.3 Note

- **Purpose**: The primary content entity; Markdown-based note that may belong to a folder.
- **Fields**
  - `id`: unique identifier.
  - `user_id`: owner.
  - `title`: optional or explicit title string.
  - `content`: Markdown content.
  - `folder_id`: optional foreign key referencing a folder.
  - `is_archived`: boolean.
  - `share_token`: optional unique token for public sharing.
  - `created_at`, `updated_at`.
  - **Local-only fields (native implementation)**:
    - `dirty`: flag in SQLite indicating unsynced changes.
- **Behavior**
  - On create/update/archive/restore/delete:
    - Local edits are applied immediately.
    - Remote sync happens in the background.
  - Archive moves notes into the Archive view; restore returns them to normal views.
  - `share_token` indicates that a note is accessible publicly via a URL and has a standalone public display screen.
  - In this app:
    - Notes are **rows in Supabase** (title, content as Markdown, `folder_id`, `is_archived`, `share_token`, timestamps). No local `.md` files; the source of truth is the database. Clients cache notes locally for a local-first feel.

### 3.4 File

- **Purpose**: Non-Markdown files (attachments, PDFs, images, media) stored in a storage bucket and associated with the user, optionally a folder.
- **Fields**
  - `id`: unique identifier.
  - `user_id`: owner.
  - `name`: filename (no path).
  - `file_path`: path or key within a storage bucket.
  - `file_size`: byte size.
  - `mime_type`: MIME type string.
  - `extension`: file extension (e.g., `pdf`, `png`).
  - `folder_id`: optional folder association.
  - `is_archived`: boolean.
  - `created_at`, `updated_at`.
- **Behavior**
  - Files can be uploaded from disk, archived, restored, and permanently deleted.
  - Files are previewable (thumbnails / open in external viewer).
  - In this app:
    - File binaries live in **Supabase Storage**; metadata (name, path, size, mime_type, folder_id, is_archived) is in Postgres. Clients cache file lists for a local-first feel.

### 3.5 Event

- **Purpose**: Calendar events for planning and reminders.
- **Fields**
  - `id`: unique identifier.
  - `user_id`: owner.
  - `title`: summary text.
  - `description`: optional longer description.
  - `event_date`: timestamp/date.
  - `repeat_interval`: enum or nullable (`once`, `daily`, `weekly`, `monthly`, `yearly`).
  - `created_at`, `updated_at`.
- **Behavior**
  - Events are shown in calendar and list views.
  - Events can be edited and deleted.
  - For offline behavior, a full list is cached locally.
  - In this app:
    - Events are **rows in Supabase** (title, description, event_date, repeat_interval). Clients cache the event list for offline calendar views; repeat rules are applied at read-time.

### 3.6 Attachment

- **Purpose**: Media files (especially images) used by notes but conceptually separate from primary File entities.
- **Fields (conceptual)**
  - `id` or `file_path`: storage key or path.
  - `user_id` (if tracked in a backend).
  - `public_url`: shareable URL.
  - `created_at`, `updated_at`.
- **Behavior**
  - Attachments are listed in a dedicated “Attachments” screen.
  - They can be deleted independently of notes (though in practice, UI should warn if referenced).
  - In this app:
    - Attachments live in **Supabase Storage** (e.g. a dedicated bucket). Notes reference them via URLs or paths; the Attachments screen lists and manages them.

### 3.7 Preferences and Theme

- **Purpose**: Local UI preferences.
- **Concepts**
  - `theme`: `light` | `dark` | `system`.
  - `view_mode` per major area (`home`, `notes`, `files`, `folders`, `attachments`): `list` | `grid`.
  - Per-folder view modes for notes and files.
- **Behavior**
  - Stored locally (no backend requirement).
  - On app start, preferences are loaded and used to configure UI layout and theme.
  - In this app:
    - Stored **locally only** (e.g. AsyncStorage, localStorage, or a small local config file) so they apply per device; no Supabase table required.

---

## 4. Feature Breakdown and UX Flows

This section is written **from the user’s perspective**, but references the current implementation for clarity.

### 4.1 Authentication & Account State

- **Goals**
  - Allow the user to sign up, log in, and log out with email/password.
  - Optionally support a “UI dev” mode that bypasses auth for demo/testing.

- **Key behaviors**
  - Login and sign-up forms with email/password fields and basic validation.
  - On successful authentication:
    - Navigate to the main app (`home` dashboard).
  - On sign-out:
    - Clear local auth/session data.
    - Navigate to the login screen.

- **Screens / routes (current implementation reference)**
  - `/(auth)/login`:
    - Combined login/sign-up experience using Supabase Auth.
    - Integrates with an `Alert` system to show success/failure messages.
  - `index`:
    - Checks whether a user is currently authenticated.
    - Redirects to `/(app)/home` if logged in, `/(auth)/login` otherwise.

- **Obsidian-style guidance**
  - Auth is required because the backend is Supabase; unauthenticated users have no data. Optional “demo” or dev mode can bypass auth for testing.
  - If a remote sync service is present, authentication should be modeled similarly (session state stored locally, tokens used to sync).

### 4.2 Home Dashboard

- **Purpose**
  - Provide a unified overview of:
    - Recent or root-level notes (not in a folder).
    - Files.
    - Upcoming events.
    - Folders.

- **Behavior**
  - Fetch and display:
    - Notes associated with the root (no folder) and not archived.
    - Files at root level, not archived.
    - Events for today/tomorrow (or a configurable window).
    - Folders list.
  - Support creating:
    - New note.
    - New file upload.
    - New event.
  - Support moving items into folders and archiving where applicable.
  - Support **view mode toggling** (list/grid) for each section, respecting saved preferences.

- **UX expectations**
  - Desktop:
    - A multi-column layout where sections may be organized in panels.
  - Mobile:
    - A vertically scrollable view that shows cards/lists for each section.
  - Always favor showing cached data and making actions feel instant.

### 4.3 Notes Index

- **Purpose**
  - Show all notes (non-archived) with filtering and quick access.

- **Behavior**
  - List notes with:
    - Title.
    - Folder (if any).
    - Excerpt/preview of content.
    - Optional badges indicating unsynced state (when using local cache + background sync to Supabase).
  - Support:
    - Create new note.
    - Open note in editor.
    - Archive note.
    - Move note to folder.
  - Loading behavior:
    - Use cached/stale data where possible.
    - Do not aggressively refetch on focus; rely on explicit refresh or important lifecycle hooks.

- **View modes**
  - List mode (one note per row).
  - Grid mode (note cards).
  - Persist user preference.

### 4.4 Note Editor

- **Purpose**
  - Full-featured Markdown editor with support for:
    - Title and content editing.
    - Toolbar with formatting actions.
    - AI-assisted content operations.
    - Attachments and images.
    - Moving note between folders.
    - Public sharing.

- **Behavior**
  - Load existing note by `id` or create a new one (`id = "new"` semantics).
  - As the user types:
    - Keep track of **dirty state** (content that differs from the last saved version).
    - Save changes either:
      - On interval/autosave.
      - On explicit action (e.g., navigating away).
  - Support AI operations, such as:
    - Generate content from prompt.
    - Summarize existing content.
    - Rewrite or improve sections.
  - Allow the user to:
    - Insert images/attachments.
    - Change folder.
    - Toggle share settings (set/unset `share_token`).

- **AI integration details**
  - Current implementation:
    - Uses pluggable providers (Groq, Gemini, custom backend).
    - Requests are built from:
      - Current note content.
      - User prompt.
      - Mode configuration (e.g., “expand”, “summarize”).
  - Obsidian-style mapping:
    - Implement a similar provider abstraction that can:
      - Call HTTP APIs or local models.
      - Insert returned text into the CodeMirror editor at the correct position.

### 4.5 Files Explorer

- **Purpose**
  - Manage non-note files, with support for upload, preview, archive, restore, delete, and folder assignment.

- **Behavior**
  - Show a list or grid of files with:
    - Name.
    - Icon/thumbnail.
    - Folder.
    - Archive status.
  - Support operations:
    - Upload new file.
    - Move file between folders.
    - Archive/unarchive.
    - Delete (with confirmation).
    - Open/preview file.
  - Offline behavior:
    - Use cached lists when remote storage is unavailable.

### 4.6 Folders

- **Purpose**
  - Let the user define logical groupings for notes and files.

- **Folder list**
  - Show all folders (non-archived) with:
    - Name.
    - Counts of notes/files (optional, but desirable).
  - Support:
    - Create new folder.
    - Rename folder.
    - Archive folder.
    - Restore folder (from Archive).
    - Delete folder (potentially permanent).

- **Folder detail**
  - For each folder:
    - Show two tabs or views:
      - Notes in this folder.
      - Files in this folder.
    - Display counts and support all per-entity operations (edit, move, archive, delete).
    - Per-tab view modes (list/grid) with persisted preferences.

- **Offline & sync semantics**
  - Operations should appear to succeed immediately and be reconciled with the backend later.
  - Current app uses a **pending operations queue**:
    - For creates, updates, deletes, archives, restores.
    - In an Obsidian-style context, if there is a remote sync layer, the same idea applies: update local metadata immediately, then queue remote changes.

### 4.7 Archive

- **Purpose**
  - Central place to manage all archived data and perform restore or permanent delete.

- **Behavior**
  - Tabs or filters for:
    - Archived notes.
    - Archived files.
    - Archived folders.
  - For each entity:
    - Show list of archived items with name, date, and key metadata.
    - Support:
      - Restore (returns item to normal views).
      - Permanent delete (irreversibly removes from storage and remote backend).
  - Performing any operation should update cached data as well as backend/sync state.

### 4.8 Calendar & Events

- **Purpose**
  - Show time-based events, including repeated events, associated with the user.

- **Behavior**
  - Calendar view (month/day/list) showing:
    - Events on specific dates.
    - Repeated events according to `repeat_interval`.
  - Event operations:
    - Create a new event with title, description, date, and repeat rule.
    - Edit event fields.
    - Delete event.
  - Offline behavior:
    - Events list is cached, used when network is unavailable.

### 4.9 Settings

- **Purpose**
  - Centralized configuration for:
    - Theme.
    - Account management.
    - Archive navigation.
    - Attachments.
    - Toolbar customization.
    - Possibly AI provider selection.

- **Key items**
  - Theme toggle:
    - Light / Dark / System.
  - Links to:
    - Archive screen.
    - Attachments screen.
  - Toolbar customization:
    - Reorder Markdown toolbar buttons.
  - Account section:
    - Sign out.
    - Show basic account information.

### 4.10 Attachments Management

- **Purpose**
  - View and manage media attachments (especially images) independent of specific notes.

- **Behavior**
  - Display list/grid of attachments:
    - Thumbnails or generic icons.
    - File name.
    - Size and type (optional).
  - Actions:
    - Copy or share link (for remote URLs).
    - Delete attachment (with confirmation).
  - This screen is particularly important when cleaning up storage usage.

### 4.11 Shared Notes (Public Sharing)

- **Purpose**
  - Enable specific notes to be shared publicly via a tokenized URL.

- **Behavior**
  - For any note:
    - User can generate a share link, which:
      - Creates or sets a `share_token` for that note.
      - Constructs a URL of the form: `APP_URL/share/<token>`.
    - User can revoke sharing, which clears `share_token`.
  - Public view:
    - Uses only the token to load and render the note (no auth).
    - Read-only representation:
      - Title.
      - Rendered Markdown content.
      - Optional creation/update times.
  - Implementation: the public share URL loads the note by `share_token` from Supabase (or from cache if already fetched); no auth required. Backend can be the same Supabase API with a public or anon-accessible endpoint for shared notes.

### 4.12 Navigation & Layout

- **Goals**
  - Provide intuitive, responsive navigation that:
    - Uses a bottom bar on small/mobile screens.
    - Uses a sidebar on tablet/desktop.
  - Show clear active state for each section (Home, Folders, Notes, Files, Calendar, Settings).

- **Behavior**
  - Navigation items:
    - Home.
    - Folders.
    - Notes.
    - Files.
    - Calendar.
    - Settings.
  - Active item detection is path-based:
    - Subroutes (e.g., note detail, folder detail) should still highlight the parent section.
  - On tap/click:
    - Navigate to the relevant route/view.
    - Provide haptic feedback on native where possible.

### 4.13 AI-assisted Content

- **Purpose**
  - Help users create, refine, and summarize content within the note editor.

- **Behavior**
  - Modal or inline command palette for AI actions:
    - User enters a prompt describing what they want (e.g., “Summarize this section”).
    - The app sends a request to the configured AI provider with:
      - Note content and/or selected text.
      - Mode and any instructions.
    - The AI response is inserted into the note or shown as a suggestion for the user to apply manually.
  - Provider abstraction:
    - Support different backends:
      - Hosted model (e.g., Groq, Gemini).
      - Custom backend URL.
    - Select provider via configuration or environment variables/settings.

---

## 5. Data Layer and Sync Semantics

This section describes **how data flows and syncs** in the current implementation, and how an Obsidian-style version should behave.

### 5.1 Current Implementation (Reference)

- **Backend**
  - Supabase (Postgres + Storage + Auth).

- **Notes**
  - Native (mobile) uses a **SQLite local reservoir**:
    - Every note write goes to SQLite.
    - A `dirty` flag marks notes needing sync.
    - Periodic or triggered sync:
      - Uploads dirty notes to Supabase, resolving duplicates and conflicting updates.
      - Downloads server notes and merges into local DB.
  - Web uses Supabase directly (no SQLite).

- **Files**
  - Stored in Supabase Storage buckets.
  - Lists are cached in AsyncStorage for offline reuse.

- **Folders**
  - Local caches of folder lists.
  - Pending operations queue for create/update/archive/restore/delete that is replayed when network is available.

- **Events**
  - Events list cached locally to support offline calendar views.

- **Attachments**
  - Supabase Storage bucket for attachments.

### 5.2 Reimplementation: Supabase Backend + Caching (Local-First Feel)

- **Backend: Supabase only**
  - **Supabase is the single source of truth.** All notes, folders, files metadata, events, and attachments live in Supabase (Postgres + Storage). There is no local file vault; the app is not “vault-based” like Obsidian.
  - Auth: Supabase Auth (email/password). All data is scoped by `user_id`.

- **Local-first feel via aggressive caching**
  - Each client (desktop, web, mobile) **caches** Supabase data locally:
    - **Notes**: e.g. SQLite or IndexedDB with a `dirty` flag for unsynced edits; background sync pushes dirty rows to Supabase and pulls latest.
    - **Folders, files, events**: cache lists and metadata locally; use a **pending operations queue** (create/update/archive/restore/delete) so the UI can apply changes immediately and replay them to Supabase when online.
    - **Attachments/files binaries**: served from Supabase Storage; cache URLs or blobs where useful for offline preview.
  - UI behavior:
    - Prefer showing **cached data**; avoid spinners and refetch-on-focus loops.
    - Apply writes to the cache (and optionally to Supabase) so actions feel instant.
    - When offline, queue mutations and sync when the connection returns.
  - Conflict handling: use IDs and timestamps (e.g. last-write-wins or merge strategies) when syncing; duplicate detection for notes as in the current app.

- **No local vault**
  - Do not implement a file-system-based vault. The reimplementation should keep Supabase as the backend and use caching to achieve a local-first experience.

---

## 6. Non-functional Requirements & UX Principles

- **Offline-first (via caching)**
  - The app must remain functional when offline or on a slow connection, including:
    - Viewing notes, files, folders, and events from the **local cache**.
    - Editing notes (writes go to cache and are marked for sync).
    - Creating new notes/folders/events (apply to cache and queue for Supabase).
    - When back online, sync pending operations and refresh cache from Supabase.

- **Latency and responsiveness**
  - All actions (creating, editing, archiving) should feel instant:
    - Update UI immediately using local state.
    - Sync runs in the background.

- **Error handling**
  - Display friendly, actionable error messages.
  - Distinguish between:
    - Validation issues (e.g., missing title).
    - Network failures (retry suggestions).
    - Auth problems (session expired).

- **Theming**
  - Support **light**, **dark**, and **system** themes.
  - Persist theme choice locally and apply on app start.
  - Theme should cover:
    - Base surfaces, text, borders.
    - Code blocks, syntax highlighting.
    - Markdown elements (headings, links, lists, blockquotes).

- **Keyboard and power user features (recommended)**
  - For desktop:
    - Keyboard shortcuts for navigation, note creation, save, etc.
    - Search or command palette to jump between notes/folders.

---

## 7. Mapping Current App to Reimplementation

This is a rough mapping to help another AI translate the existing architecture into the new stack (Obsidian-like UI/editor, Supabase backend, aggressive caching).

- **React Native screens → Desktop / web / mobile views**
  - `/(app)/home` → Main dashboard pane.
  - `/(app)/notes`, `/note/[id]` → Notes list + editor views.
  - `/(app)/files` → Files pane.
  - `/(app)/folders`, `/folder/[id]` → Folders tree + detail panes.
  - `/(app)/calendar` → Calendar pane.
  - `/(app)/archive` → Archive management pane.
  - `/(app)/settings` → Settings window or modal.
  - `/share/[token]` → Public read-only note view (load from Supabase by token).

- **Contexts → Global state modules**
  - Auth context → Supabase Auth session + sign-in/sign-out.
  - Theme context → Global theme store integrated with CSS variables.
  - View mode context → UI layout preference store (local only).
  - Navigation context → Router/active pane state.
  - Alert context → Global notification/alert service.

- **Data: Supabase remains the backend**
  - Notes, folders, events → Postgres tables; clients cache and sync (see §5.2).
  - Files & attachments → Supabase Storage + metadata in Postgres; cache lists and optionally blobs/URLs.
  - No local file vault; “local-first” is achieved by caching, not by storing data primarily on disk.

- **React Query / data layer**
  - Use cached reads (e.g. from local DB or in-memory cache) as the default source for the UI.
  - Background sync with Supabase; invalidate or update cache when sync completes.
  - Preserve the “stale but shown” UX: render from cache immediately; avoid refetch-on-focus and spinner-heavy flows.

- **AI providers**
  - Keep a similar provider abstraction:
    - Each provider implements a `generateContent`-like function.
    - The note editor calls this with note content and returns inserted text.

---

## 8. Environment, Configuration, and Flags

- **Supabase**
  - `EXPO_PUBLIC_SUPABASE_URL` (or equivalent) and `EXPO_PUBLIC_SUPABASE_KEY` (or equivalent) for the Supabase project. All clients use the same project; Auth, Postgres, and Storage are the backend.

- **Feature flags**
  - `uiDevMode`: bypass auth and/or use mock data for development.
  - `aiProvider`: select which AI integration to use (Groq, Gemini, custom backend).

- **Secrets and keys**
  - Supabase anon key (and optional service role for server-side if needed).
  - AI API keys (e.g. Groq, Gemini) or custom backend URL. Store securely (e.g. env vars, OS keychain on desktop, secure storage on mobile).

---

## 9. Summary for the Next AI Agent

- **Goal**
  - Rebuild `gopx-drive` with an **Obsidian-like UI and editor** (e.g. Electron + TypeScript + CodeMirror), **plus a first-class web app and mobile clients**. The **backend is Supabase** (source of truth); the app uses **aggressive caching** on each client to deliver a **local-first feel** (no local file vault).
  - Preserve:
    - **Desktop, web, and mobile** – All three platforms with full feature parity (web is a key differentiator from Obsidian).
    - All described core features (notes, files, folders, events, archive, attachments, settings).
    - Local-first feel via caching and background sync to Supabase; offline-capable where possible.
    - AI-assisted note editing.

- **Key expectations**
  - **Supabase is the backend.** Do not implement a local file vault; use Supabase (Postgres + Storage + Auth) and cache data locally for speed and offline support.
  - Match the **user-facing behavior** documented in sections 4 and 5.
  - Implement the **domain model** and **navigation structure** described in sections 3 and 7.
  - Ship on **desktop, web, and mobile**; the web app must be a full client, not a read-only or lite version.
  - Use the **target tech stack** from section 1 (Obsidian-like UI/editor) while keeping Supabase as the data backend and caching for a local-first experience.

