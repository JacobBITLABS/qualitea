import type { PropsWithChildren } from 'react';
import { SQLiteProvider, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export const DB_NAME = 'qualitea.db';

/** Bump when the schema changes; add a matching block in `migrate`. */
const SCHEMA_VERSION = 1;

/**
 * The full Milestone-1 schema. Run inside a versioned migration so future
 * changes append rather than recreate. See src/data/types.ts for the matching
 * TypeScript interfaces.
 */
const SCHEMA_V1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  color_hex       TEXT,
  remote_path     TEXT,
  sync_state      TEXT NOT NULL DEFAULT 'local',
  etag            TEXT,
  remote_id       TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  deleted_at      INTEGER
);

CREATE TABLE IF NOT EXISTS notes (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                 TEXT,
  text_body             TEXT,
  lat                   REAL,
  lng                   REAL,
  accuracy_m            REAL,
  altitude_m            REAL,
  place_name            TEXT,
  location_captured_at  INTEGER,
  transcript_text       TEXT,
  transcript_status     TEXT NOT NULL DEFAULT 'none',
  sync_state            TEXT NOT NULL DEFAULT 'local',
  etag                  TEXT,
  remote_path           TEXT,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  deleted_at            INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_sync    ON notes(sync_state) WHERE sync_state != 'synced';

CREATE TABLE IF NOT EXISTS note_media (
  id                  TEXT PRIMARY KEY,
  note_id             TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  kind                TEXT NOT NULL CHECK(kind IN ('photo','video','audio','text')),
  file_path           TEXT,
  mime_type           TEXT,
  duration_ms         INTEGER,
  width               INTEGER,
  height              INTEGER,
  thumb_path          TEXT,
  byte_size           INTEGER,
  transcript_text     TEXT,
  transcript_status   TEXT NOT NULL DEFAULT 'none',
  sync_state          TEXT NOT NULL DEFAULT 'local',
  etag                TEXT,
  remote_path         TEXT,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  deleted_at          INTEGER
);
CREATE INDEX IF NOT EXISTS idx_media_note ON note_media(note_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS sync_queue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity      TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  op          TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  last_error  TEXT,
  queued_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(queued_at);
`;

/**
 * Versioned migration. Sets WAL + foreign keys (foreign_keys is
 * connection-scoped, so it must be set on each open) and applies any pending
 * schema versions. Passed as `onInit` to `SQLiteProvider`.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(SCHEMA_V1);
  }
  // Future: if (current < 2) { await db.execAsync(SCHEMA_V2); }

  if (current !== SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}

/** Open the database outside of React (e.g. for ad-hoc/debug use). */
export async function openDb(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await migrate(db);
  return db;
}

/**
 * Wrap the app (in _layout.tsx) so every screen can read the database via
 * `useSQLiteContext()`. Migrations run once on first open.
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={migrate}>
      {children}
    </SQLiteProvider>
  );
}
