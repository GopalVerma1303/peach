# gopx-drive

Supabase-backed knowledge and file management app with an Obsidian-like UI. Desktop (Electron), web, and mobile (Capacitor) from a single codebase. Local-first feel via aggressive client-side caching.

## Stack

- **Frontend**: React, TypeScript, Vite, React Router, CodeMirror 6 (Markdown)
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Cache/sync**: IndexedDB (web/desktop), pending operations queue, background sync
- **Desktop**: Electron
- **Mobile**: Capacitor (wraps the web app)

## Setup

### 1. Install dependencies

From the repo root (requires [Bun](https://bun.sh)):

```bash
bun install
```

### 2. Supabase

1. Create a [Supabase](https://supabase.com) project.
2. Run the migrations in `supabase/migrations/` (in order: `00001_schema.sql`, `00002_storage.sql`, `00003_shared_note_rpc.sql`).
3. Create Storage buckets `files` and `attachments` if not created by migration; set RLS so users can read/write only under their path prefix (`{user_id}/*`).

### 3. Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – your Supabase anon key

Optional:

- `VITE_UI_DEV_MODE=true` – bypass auth for local testing
- `VITE_AI_PROVIDER`, `VITE_GROQ_API_KEY`, etc. – for AI features

### 4. Build order

Build shared packages first, then the web app:

```bash
bun run build --filter @gopx-drive/core
bun run build --filter @gopx-drive/cache-web
bun run build --filter web
```

Or from root:

```bash
bun run build
```

### 5. Run

- **Web**: `bun run dev` (or `bun run dev:web`) then open http://localhost:5173
- **Desktop**: Start web dev server, then `bun run desktop` (Electron loads the dev server)
- **Mobile**: Build web, then `cd apps/mobile && bunx cap sync && bunx cap open ios` (or `android`)

## Project layout

- `packages/core` – types, Supabase client, API wrapper, sync/cache interfaces, AI providers
- `packages/cache-web` – IndexedDB cache and sync service for web/Electron
- `apps/web` – Vite + React SPA (shared by desktop and mobile)
- `apps/desktop` – Electron shell
- `apps/mobile` – Capacitor config (web app lives in `../web/dist`)
- `supabase/migrations` – Postgres schema, RLS, Storage, RPC

## Features

- Auth (email/password via Supabase)
- Home dashboard (recent notes, files, events, folders)
- Notes (CRUD, Markdown with CodeMirror, autosave, share link)
- Files (upload, list, archive)
- Folders (CRUD, per-folder notes/files)
- Calendar/events
- Archive (restore, permanent delete)
- Settings (theme, account, links to Archive/Attachments)
- Attachments management
- Public shared notes via `/share/:token`
- Local-first: cache + pending ops queue, sync when online

## License

Private / unlicensed unless otherwise stated.
