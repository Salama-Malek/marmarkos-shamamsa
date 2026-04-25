import { getDb } from './client';
import { newId } from '@/lib/id';
import type { Feast } from '@/types';

interface FeastRow {
  id: string;
  ar_name: string;
  sort_order: number;
  is_seeded: number;
  created_at: number;
  updated_at: number;
}

function fromRow(row: FeastRow): Feast {
  return {
    id: row.id,
    arName: row.ar_name,
    sortOrder: row.sort_order,
    isSeeded: row.is_seeded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFeasts(): Promise<Feast[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FeastRow>(
    `SELECT * FROM feasts ORDER BY sort_order ASC, ar_name ASC;`,
  );
  return rows.map(fromRow);
}

export async function getFeast(id: string): Promise<Feast | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<FeastRow>(`SELECT * FROM feasts WHERE id = ?;`, id);
  return row ? fromRow(row) : null;
}

export async function createFeast(arName: string): Promise<Feast> {
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  // Append at end of order — caller can reorder later if needed.
  const last = await db.getFirstAsync<{ max: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) AS max FROM feasts;`,
  );
  const sortOrder = (last?.max ?? 0) + 10;
  await db.runAsync(
    `INSERT INTO feasts (id, ar_name, sort_order, is_seeded, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?);`,
    id,
    arName.trim(),
    sortOrder,
    now,
    now,
  );
  const created = await getFeast(id);
  if (!created) throw new Error('Failed to create feast');
  return created;
}

export async function updateFeast(id: string, arName: string): Promise<Feast> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE feasts SET ar_name = ?, updated_at = ? WHERE id = ?;`,
    arName.trim(),
    now,
    id,
  );
  const updated = await getFeast(id);
  if (!updated) throw new Error('Feast not found');
  return updated;
}

export async function getFeastPartCounts(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ feast_id: string; n: number }>(
    `SELECT feast_id, COUNT(*) AS n FROM feast_parts GROUP BY feast_id;`,
  );
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.feast_id, r.n);
  return map;
}

export async function deleteFeast(id: string): Promise<void> {
  const db = await getDb();
  // Seeded feasts shouldn't be deleted via UI; the DAL still allows it for
  // restore/wipe flows. Liturgies referencing this feast keep their feast_id
  // null after the cascade SET NULL.
  await db.runAsync(`DELETE FROM feasts WHERE id = ?;`, id);
}
