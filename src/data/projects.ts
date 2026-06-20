import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

import { uuid } from './id';
import { enqueueSyncChange } from './sync';
import type { NewProjectInput, Project } from './types';

export async function listProjects(db: SQLiteDatabase): Promise<Project[]> {
  return db.getAllAsync<Project>(
    `SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
  );
}

/** A project row plus its live note count, for list badges. */
export interface ProjectListItem extends Project {
  note_count: number;
}

export async function listProjectsList(db: SQLiteDatabase): Promise<ProjectListItem[]> {
  return db.getAllAsync<ProjectListItem>(
    `SELECT p.*,
       (SELECT COUNT(*) FROM notes n
          WHERE n.project_id = p.id AND n.deleted_at IS NULL) AS note_count
     FROM projects p
     WHERE p.deleted_at IS NULL
     ORDER BY p.updated_at DESC`,
  );
}

export async function getProject(db: SQLiteDatabase, id: string): Promise<Project | null> {
  return db.getFirstAsync<Project>(`SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL`, id);
}

export async function createProject(db: SQLiteDatabase, input: NewProjectInput): Promise<Project> {
  const id = uuid();
  const ts = Date.now();
  await db.runAsync(
    `INSERT INTO projects (id, name, description, color_hex, sync_state, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    id,
    input.name,
    input.description ?? null,
    input.color_hex ?? null,
    ts,
    ts,
  );
  await enqueueSyncChange(db, 'project', id, 'upsert');
  const created = await getProject(db, id);
  if (!created) throw new Error('Project insert failed');
  return created;
}

export type ProjectUpdate = Partial<Pick<Project, 'name' | 'description' | 'color_hex'>>;

export async function updateProject(
  db: SQLiteDatabase,
  id: string,
  patch: ProjectUpdate,
): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const columns = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v) as SQLiteBindValue[];
  columns.push(`updated_at = ?`, `sync_state = 'pending'`);
  values.push(Date.now());

  await db.runAsync(
    `UPDATE projects SET ${columns.join(', ')} WHERE id = ?`,
    ...values,
    id,
  );
  await enqueueSyncChange(db, 'project', id, 'upsert');
}

export async function softDeleteProject(db: SQLiteDatabase, id: string): Promise<void> {
  const ts = Date.now();
  await db.runAsync(
    `UPDATE projects SET deleted_at = ?, updated_at = ?, sync_state = 'pending' WHERE id = ?`,
    ts,
    ts,
    id,
  );
  await enqueueSyncChange(db, 'project', id, 'delete');
}

/** Count of non-deleted notes in a project (for list badges). */
export async function countNotesInProject(db: SQLiteDatabase, projectId: string): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM notes WHERE project_id = ? AND deleted_at IS NULL`,
    projectId,
  );
  return row?.c ?? 0;
}
