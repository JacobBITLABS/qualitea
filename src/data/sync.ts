import type { SQLiteDatabase } from 'expo-sqlite';

import type { SyncEntity, SyncOp } from './types';

/**
 * Records an outbound change in `sync_queue` for the (not-yet-built) sync worker
 * to drain. Every repository mutation calls this, so enabling Nextcloud sync
 * later is purely additive — add a worker; no screen/repository rewrites.
 *
 * Coalesces an existing pending entry for the same entity+op to avoid duplicate
 * work (e.g. multiple edits before a sync).
 */
export async function enqueueSyncChange(
  db: SQLiteDatabase,
  entity: SyncEntity,
  entityId: string,
  op: SyncOp,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue (entity, entity_id, op, queued_at)
     SELECT ?, ?, ?, ?
     WHERE NOT EXISTS (
       SELECT 1 FROM sync_queue
       WHERE entity = ? AND entity_id = ? AND op = ? AND last_error IS NULL
     )`,
    entity,
    entityId,
    op,
    Date.now(),
    entity,
    entityId,
    op,
  );
}
