/**
 * Domain types mirroring the SQLite schema (src/data/db.ts). Field names match
 * the column names 1:1 so rows from `getAllAsync<T>()` map without a transform.
 *
 * Future-proofing columns (transcript_*, sync_state, etag, remote_path,
 * remote_id) are present now but unused in Milestone 1 — they exist so that
 * transcription and Nextcloud WebDAV sync can be added without a schema rewrite.
 */

export type MediaKind = 'photo' | 'video' | 'audio' | 'text';
export type SyncState = 'local' | 'pending' | 'synced' | 'error';
export type TranscriptStatus = 'none' | 'requested' | 'processing' | 'done' | 'error';
export type SyncEntity = 'project' | 'note' | 'note_media';
export type SyncOp = 'upsert' | 'delete';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  remote_path: string | null;
  sync_state: SyncState;
  etag: string | null;
  remote_id: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Note {
  id: string;
  project_id: string;
  title: string | null;
  text_body: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  altitude_m: number | null;
  place_name: string | null;
  location_captured_at: number | null;
  transcript_text: string | null;
  transcript_status: TranscriptStatus;
  sync_state: SyncState;
  etag: string | null;
  remote_path: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface NoteMedia {
  id: string;
  note_id: string;
  kind: MediaKind;
  /** Relative path under Paths.document, e.g. media/<projectId>/<noteId>/<uuid>.jpg. */
  file_path: string | null;
  mime_type: string | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  thumb_path: string | null;
  byte_size: number | null;
  transcript_text: string | null;
  transcript_status: TranscriptStatus;
  sync_state: SyncState;
  etag: string | null;
  remote_path: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

/** A note joined with its non-deleted media items. */
export interface NoteWithMedia extends Note {
  media: NoteMedia[];
}

export interface SyncQueueItem {
  id: number;
  entity: SyncEntity;
  entity_id: string;
  op: SyncOp;
  attempts: number;
  last_error: string | null;
  queued_at: number;
}

/** Input shapes (omit auto-managed columns) for create operations. */
export type NewProjectInput = Pick<Project, 'name'> &
  Partial<Pick<Project, 'description' | 'color_hex'>>;

export type NewNoteInput = Pick<Note, 'project_id'> &
  Partial<
    Pick<
      Note,
      'title' | 'text_body' | 'lat' | 'lng' | 'accuracy_m' | 'altitude_m' | 'place_name' | 'location_captured_at'
    >
  >;

export type NewMediaInput = Pick<NoteMedia, 'note_id' | 'kind'> &
  Partial<
    Pick<
      NoteMedia,
      'file_path' | 'mime_type' | 'duration_ms' | 'width' | 'height' | 'thumb_path' | 'byte_size'
    >
  >;
