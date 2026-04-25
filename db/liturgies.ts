import { getDb } from './client';
import { newId } from '@/lib/id';
import type { Liturgy, LiturgyStatus } from '@/types';

interface LiturgyRow {
  id: string;
  date: string;
  feast_id: string | null;
  title: string | null;
  notes: string | null;
  status: LiturgyStatus;
  cancellation_reason: string | null;
  created_at: number;
  updated_at: number;
}

function fromRow(row: LiturgyRow): Liturgy {
  return {
    id: row.id,
    date: row.date,
    feastId: row.feast_id ?? undefined,
    title: row.title ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    cancellationReason: row.cancellation_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DuplicateLiturgyDateError extends Error {
  constructor(public readonly existingId: string, public readonly date: string) {
    super(`Liturgy already exists on ${date} (id=${existingId})`);
    this.name = 'DuplicateLiturgyDateError';
  }
}

export type LiturgiesFilter = 'all' | 'held' | 'cancelled';

export interface LiturgyListItem extends Liturgy {
  feastName?: string;
  counts: { present: number; absent: number; excused: number };
  assignmentsCount: number;
}

export async function listLiturgies(
  opts: { filter?: LiturgiesFilter; yearMonth?: string } = {},
): Promise<LiturgyListItem[]> {
  const db = await getDb();
  const filter = opts.filter ?? 'all';
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter !== 'all') {
    where.push('l.status = ?');
    params.push(filter);
  }
  if (opts.yearMonth) {
    where.push('substr(l.date, 1, 7) = ?');
    params.push(opts.yearMonth);
  }
  const sql = `
    SELECT
      l.*, f.ar_name AS feast_name,
      (SELECT COUNT(*) FROM attendance a WHERE a.liturgy_id = l.id AND a.status = 'present') AS present_n,
      (SELECT COUNT(*) FROM attendance a WHERE a.liturgy_id = l.id AND a.status = 'absent') AS absent_n,
      (SELECT COUNT(*) FROM attendance a WHERE a.liturgy_id = l.id AND a.status = 'excused') AS excused_n,
      (SELECT COUNT(*) FROM assignments x WHERE x.liturgy_id = l.id) AS assignments_n
    FROM liturgies l
    LEFT JOIN feasts f ON f.id = l.feast_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.date DESC;
  `;
  const rows = await db.getAllAsync<
    LiturgyRow & {
      feast_name: string | null;
      present_n: number;
      absent_n: number;
      excused_n: number;
      assignments_n: number;
    }
  >(sql, ...params);
  return rows.map((r) => ({
    ...fromRow(r),
    feastName: r.feast_name ?? undefined,
    counts: { present: r.present_n, absent: r.absent_n, excused: r.excused_n },
    assignmentsCount: r.assignments_n,
  }));
}

export async function getLiturgy(id: string): Promise<Liturgy | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LiturgyRow>(`SELECT * FROM liturgies WHERE id = ?;`, id);
  return row ? fromRow(row) : null;
}

export async function getLiturgyByDate(date: string): Promise<Liturgy | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LiturgyRow>(`SELECT * FROM liturgies WHERE date = ?;`, date);
  return row ? fromRow(row) : null;
}

export interface LiturgyInput {
  date: string;
  feastId?: string;
  title?: string;
  notes?: string;
  status?: LiturgyStatus;
  cancellationReason?: string;
}

export async function createLiturgy(input: LiturgyInput): Promise<Liturgy> {
  const existing = await getLiturgyByDate(input.date);
  if (existing) throw new DuplicateLiturgyDateError(existing.id, input.date);
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  await db.runAsync(
    `INSERT INTO liturgies (id, date, feast_id, title, notes, status, cancellation_reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.date,
    input.feastId || null,
    input.title?.trim() || null,
    input.notes?.trim() || null,
    input.status ?? 'held',
    input.cancellationReason?.trim() || null,
    now,
    now,
  );
  const created = await getLiturgy(id);
  if (!created) throw new Error('Failed to create liturgy');
  return created;
}

export async function updateLiturgy(id: string, input: LiturgyInput): Promise<Liturgy> {
  const existing = await getLiturgyByDate(input.date);
  if (existing && existing.id !== id) {
    throw new DuplicateLiturgyDateError(existing.id, input.date);
  }
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE liturgies
        SET date = ?, feast_id = ?, title = ?, notes = ?, status = ?, cancellation_reason = ?, updated_at = ?
      WHERE id = ?;`,
    input.date,
    input.feastId || null,
    input.title?.trim() || null,
    input.notes?.trim() || null,
    input.status ?? 'held',
    input.cancellationReason?.trim() || null,
    now,
    id,
  );
  const updated = await getLiturgy(id);
  if (!updated) throw new Error('Liturgy not found');
  return updated;
}

export async function deleteLiturgy(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM liturgies WHERE id = ?;`, id);
}

export async function listLiturgyMonths(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ ym: string }>(
    `SELECT DISTINCT substr(date, 1, 7) AS ym FROM liturgies ORDER BY ym DESC;`,
  );
  return rows.map((r) => r.ym);
}

export async function countLiturgies(): Promise<{ total: number; held: number; cancelled: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number; held: number; cancelled: number }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'held' THEN 1 ELSE 0 END) AS held,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM liturgies;`,
  );
  return {
    total: row?.total ?? 0,
    held: row?.held ?? 0,
    cancelled: row?.cancelled ?? 0,
  };
}
