import type { SQLiteDatabase } from 'expo-sqlite';

import { uuid } from './id';
import { enqueueSyncChange } from './sync';
import type { NewMediaInput, NoteMedia } from './types';

export async function getMedia(db: SQLiteDatabase, id: string): Promise<NoteMedia | null> {
  return db.getFirstAsync<NoteMedia>(
    `SELECT * FROM note_media WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
}

export async function listMediaForNote(db: SQLiteDatabase, noteId: string): Promise<NoteMedia[]> {
  return db.getAllAsync<NoteMedia>(
    `SELECT * FROM note_media WHERE note_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    noteId,
  );
}

export async function addMedia(db: SQLiteDatabase, input: NewMediaInput): Promise<NoteMedia> {
  const id = uuid();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO note_media (
       id, note_id, kind, file_path, mime_type, duration_ms, width, height,
       thumb_path, byte_size, sync_state, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    id,
    input.note_id,
    input.kind,
    input.file_path ?? null,
    input.mime_type ?? null,
    input.duration_ms ?? null,
    input.width ?? null,
    input.height ?? null,
    input.thumb_path ?? null,
    input.byte_size ?? null,
    ts,
    ts,
  );
  await enqueueSyncChange(db, 'note_media', id, 'upsert');
  const created = await getMedia(db, id);
  if (!created) throw new Error('Media insert failed');
  return created;
}

export async function softDeleteMedia(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = Date.now();
  await db.runAsync(
    `UPDATE note_media SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ?`,
    ts,
    ts,
    id,
  );
  await enqueueSyncChange(db, 'note_media', id, 'delete');
}

/** Sum of byte_size for all live media — used by the Settings storage readout. */
export async function totalMediaBytes(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(byte_size), 0) AS total FROM note_media WHERE deleted_at IS NULL`,
  );
  return row?.total ?? 0;
}
