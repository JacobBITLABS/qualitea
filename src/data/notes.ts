import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

import { uuid } from './id';
import { enqueueSyncChange } from './sync';
import type { MediaKind, NewNoteInput, Note, NoteMedia, NoteWithMedia } from './types';

export async function listNotesByProject(db: SQLiteDatabase, projectId: string): Promise<Note[]> {
  return db.getAllAsync<Note>(
    `SELECT * FROM notes WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
    projectId,
  );
}

/** A note row plus media_count + a thumbnail path/kind for grid previews. */
export interface NoteListItem extends Note {
  media_count: number;
  thumb_path: string | null;
  thumb_kind: MediaKind | null;
}

export async function listNoteListItems(
  db: SQLiteDatabase,
  projectId: string,
): Promise<NoteListItem[]> {
  return db.getAllAsync<NoteListItem>(
    `SELECT n.*,
       (SELECT COUNT(*) FROM note_media m
          WHERE m.note_id = n.id AND m.deleted_at IS NULL) AS media_count,
       (SELECT m2.file_path FROM note_media m2
          WHERE m2.note_id = n.id AND m2.deleted_at IS NULL
            AND m2.kind IN ('photo','video')
          ORDER BY m2.created_at ASC LIMIT 1) AS thumb_path,
       (SELECT m3.kind FROM note_media m3
          WHERE m3.note_id = n.id AND m3.deleted_at IS NULL
            AND m3.kind IN ('photo','video')
          ORDER BY m3.created_at ASC LIMIT 1) AS thumb_kind
     FROM notes n
     WHERE n.project_id = ? AND n.deleted_at IS NULL
     ORDER BY n.created_at DESC`,
    projectId,
  );
}

export async function getNote(db: SQLiteDatabase, id: string): Promise<Note | null> {
  return db.getFirstAsync<Note>(`SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL`, id);
}

export async function getNoteWithMedia(db: SQLiteDatabase, id: string): Promise<NoteWithMedia | null> {
  const note = await db.getFirstAsync<Note>(
    `SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
  if (!note) return null;
  const media = await db.getAllAsync<NoteMedia>(
    `SELECT * FROM note_media WHERE note_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    id,
  );
  return { ...note, media };
}

export async function createNote(db: SQLiteDatabase, input: NewNoteInput): Promise<Note> {
  const id = uuid();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO notes (
       id, project_id, title, text_body, lat, lng, accuracy_m, altitude_m,
       place_name, location_captured_at, sync_state, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    id,
    input.project_id,
    input.title ?? null,
    input.text_body ?? null,
    input.lat ?? null,
    input.lng ?? null,
    input.accuracy_m ?? null,
    input.altitude_m ?? null,
    input.place_name ?? null,
    input.location_captured_at ?? null,
    ts,
    ts,
  );
  await enqueueSyncChange(db, 'note', id, 'upsert');
  const created = await getNote(db, id);
  if (!created) throw new Error('Note insert failed');
  return created;
}

export type NoteUpdate = Partial<
  Pick<
    Note,
    | 'title'
    | 'text_body'
    | 'lat'
    | 'lng'
    | 'accuracy_m'
    | 'altitude_m'
    | 'place_name'
    | 'location_captured_at'
  >
>;

export async function updateNote(db: SQLiteDatabase, id: string, patch: NoteUpdate): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const columns = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v) as SQLiteBindValue[];
  columns.push(`updated_at = ?`, `sync_state = 'pending'`);
  values.push(Date.now());

  await db.runAsync(`UPDATE notes SET ${columns.join(', ')} WHERE id = ?`, ...values, id);
  await enqueueSyncChange(db, 'note', id, 'upsert');
}

export async function softDeleteNote(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = Date.now();
  await db.runAsync(
    `UPDATE notes SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ?`,
    ts,
    ts,
    id,
  );
  await enqueueSyncChange(db, 'note', id, 'delete');
}
