import { Directory, File, Paths } from 'expo-file-system';

import type { MediaKind } from './types';

/** Root folder (relative to Paths.document) where all captured media lives. */
const MEDIA_ROOT = 'media';

/**
 * Resolve a stored *relative* media path (e.g. `media/<projectId>/<noteId>/<uuid>.jpg`)
 * to an absolute `file://` URI for display/playback via expo-image / expo-video /
 * expo-audio. Returns null when there is no file (e.g. text-only media).
 */
export function resolveMediaUri(relativePath: string | null): string | null {
  if (!relativePath) return null;
  const parts = relativePath.split('/').filter(Boolean);
  return new File(Paths.document, ...parts).uri;
}

/** Default file extension for each capture kind. */
export function defaultExtensionFor(kind: MediaKind): string {
  switch (kind) {
    case 'photo':
      return 'jpg';
    case 'video':
      return 'mov';
    case 'audio':
      return 'm4a';
    default:
      return 'bin';
  }
}

/**
 * Best-effort extension from a URI's filename (e.g. `.mov`/`.mp4`/`.jpg`),
 * falling back to the default for the kind so files stay playable on disk.
 */
export function extFromUri(uri: string, fallback: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  const slash = clean.lastIndexOf('/');
  if (dot > slash) {
    const ext = clean.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]{2,4}$/.test(ext)) return ext;
  }
  return fallback;
}

export interface PersistMediaArgs {
  /** Temporary cache URI returned by expo-camera / expo-audio. */
  tempUri: string;
  projectId: string;
  noteId: string;
  /** UUID used as the persisted file name (matches the note_media row id). */
  mediaId: string;
  kind: MediaKind;
  /** Override the default extension (e.g. for a picked .png or .mp4). */
  ext?: string;
}

export interface PersistedMedia {
  /** Relative path to store in the DB (portable across installs/backups). */
  file_path: string;
  byte_size: number | null;
}

/**
 * Move a freshly-captured temp file into persistent app storage. Captured URIs
 * live in cache and may be evicted by the system, so this MUST run before the
 * path is stored in the DB. Falls back to copy-then-delete if `move` fails
 * (e.g. cross-volume on some Android setups).
 */
export async function persistMediaFile(args: PersistMediaArgs): Promise<PersistedMedia> {
  const ext = args.ext ?? defaultExtensionFor(args.kind);
  const dir = new Directory(Paths.document, MEDIA_ROOT, args.projectId, args.noteId);
  if (!dir.exists) {
    dir.create();
  }

  const dest = new File(Paths.document, MEDIA_ROOT, args.projectId, args.noteId, `${args.mediaId}.${ext}`);
  const src = new File(args.tempUri);

  try {
    await src.move(dest);
  } catch {
    await src.copy(dest);
    if (src.exists) {
      src.delete();
    }
  }

  return {
    file_path: `${MEDIA_ROOT}/${args.projectId}/${args.noteId}/${args.mediaId}.${ext}`,
    byte_size: dest.info().size ?? null,
  };
}

/** Remove a persisted media file from disk (best-effort, on delete). */
export function deleteMediaFile(relativePath: string | null): void {
  if (!relativePath) return;
  const parts = relativePath.split('/').filter(Boolean);
  const file = new File(Paths.document, ...parts);
  if (file.exists) {
    file.delete();
  }
}
