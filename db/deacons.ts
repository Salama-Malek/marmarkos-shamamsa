import { getDb } from './client';
import { newId } from '@/lib/id';
import type { Deacon } from '@/types';

interface DeaconRow {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  joined_date: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
}

function fromRow(row: DeaconRow): Deacon {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    joinedDate: row.joined_date ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

export interface ListDeaconsOptions {
  filter?: 'active' | 'archived' | 'all';
  search?: string;
}

export async function listDeacons(opts: ListDeaconsOptions = {}): Promise<Deacon[]> {
  const db = await getDb();
  const filter = opts.filter ?? 'active';
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter === 'active') where.push('is_active = 1');
  else if (filter === 'archived') where.push('is_active = 0');
  if (opts.search && opts.search.trim().length > 0) {
    where.push('name LIKE ?');
    params.push(`%${opts.search.trim()}%`);
  }
  const sql = `SELECT * FROM deacons${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY name ASC;`;
  const rows = await db.getAllAsync<DeaconRow>(sql, ...params);
  return rows.map(fromRow);
}

export async function getDeacon(id: string): Promise<Deacon | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DeaconRow>(`SELECT * FROM deacons WHERE id = ?;`, id);
  return row ? fromRow(row) : null;
}

export interface DeaconInput {
  name: string;
  phone?: string;
  notes?: string;
  joinedDate?: string;
}

export async function createDeacon(input: DeaconInput): Promise<Deacon> {
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  await db.runAsync(
    `INSERT INTO deacons (id, name, phone, notes, joined_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
    id,
    input.name.trim(),
    input.phone?.trim() || null,
    input.notes?.trim() || null,
    input.joinedDate || null,
    now,
    now,
  );
  const created = await getDeacon(id);
  if (!created) throw new Error('Failed to create deacon');
  return created;
}

export async function updateDeacon(id: string, input: DeaconInput): Promise<Deacon> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE deacons SET name = ?, phone = ?, notes = ?, joined_date = ?, updated_at = ? WHERE id = ?;`,
    input.name.trim(),
    input.phone?.trim() || null,
    input.notes?.trim() || null,
    input.joinedDate || null,
    now,
    id,
  );
  const updated = await getDeacon(id);
  if (!updated) throw new Error('Deacon not found');
  return updated;
}

export async function archiveDeacon(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE deacons SET is_active = 0, archived_at = ?, updated_at = ? WHERE id = ?;`,
    now,
    now,
    id,
  );
}

export async function restoreDeacon(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE deacons SET is_active = 1, archived_at = NULL, updated_at = ? WHERE id = ?;`,
    now,
    id,
  );
}

export async function hardDeleteDeacon(id: string): Promise<void> {
  const db = await getDb();
  // FK ON DELETE CASCADE handles attendance + assignments rows.
  await db.runAsync(`DELETE FROM deacons WHERE id = ?;`, id);
}

export async function countDeacons(): Promise<{ total: number; active: number; archived: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number; active: number; archived: number }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS archived
     FROM deacons;`,
  );
  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    archived: row?.archived ?? 0,
  };
}
