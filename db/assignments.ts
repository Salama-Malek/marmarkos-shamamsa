import { getDb } from './client';
import type { Assignment, AssignmentStatus } from '@/types';
import { getAttendanceStatusFor } from './attendance';

interface AssignmentRow {
  liturgy_id: string;
  part_id: string;
  deacon_id: string;
  status: AssignmentStatus;
  note: string | null;
  assigned_at: number;
}

function fromRow(row: AssignmentRow): Assignment {
  return {
    liturgyId: row.liturgy_id,
    partId: row.part_id,
    deaconId: row.deacon_id,
    status: row.status,
    note: row.note ?? undefined,
    assignedAt: row.assigned_at,
  };
}

export class AbsentDeaconAssignmentError extends Error {
  constructor(public readonly deaconId: string, public readonly liturgyId: string) {
    super(`Deacon ${deaconId} is not marked present for liturgy ${liturgyId}`);
    this.name = 'AbsentDeaconAssignmentError';
  }
}

export async function getAssignmentsForLiturgy(liturgyId: string): Promise<Assignment[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AssignmentRow>(
    `SELECT * FROM assignments WHERE liturgy_id = ?;`,
    liturgyId,
  );
  return rows.map(fromRow);
}

export interface AssignmentDetail extends Assignment {
  partName: string;
  partCategory: string;
  partSortOrder: number;
  deaconName: string;
}

export async function getAssignmentsForLiturgyDetailed(liturgyId: string): Promise<AssignmentDetail[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<
    AssignmentRow & {
      part_name: string;
      part_category: string;
      part_sort_order: number;
      deacon_name: string;
    }
  >(
    `SELECT a.*,
            p.ar_name AS part_name,
            p.category AS part_category,
            p.sort_order AS part_sort_order,
            d.name AS deacon_name
       FROM assignments a
       JOIN parts p ON p.id = a.part_id
       JOIN deacons d ON d.id = a.deacon_id
      WHERE a.liturgy_id = ?
      ORDER BY p.sort_order ASC, p.ar_name ASC;`,
    liturgyId,
  );
  return rows.map((r) => ({
    ...fromRow(r),
    partName: r.part_name,
    partCategory: r.part_category,
    partSortOrder: r.part_sort_order,
    deaconName: r.deacon_name,
  }));
}

/** Assign a part. Validates that the deacon is marked present. */
export async function setAssignment(
  liturgyId: string,
  partId: string,
  deaconId: string,
  note?: string,
): Promise<void> {
  const status = await getAttendanceStatusFor(liturgyId, deaconId);
  if (status !== 'present') {
    throw new AbsentDeaconAssignmentError(deaconId, liturgyId);
  }
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO assignments (liturgy_id, part_id, deacon_id, status, note, assigned_at)
     VALUES (?, ?, ?, 'planned', ?, ?)
     ON CONFLICT(liturgy_id, part_id) DO UPDATE SET
       deacon_id = excluded.deacon_id,
       note = excluded.note,
       assigned_at = excluded.assigned_at,
       status = 'planned';`,
    liturgyId,
    partId,
    deaconId,
    note?.trim() || null,
    now,
  );
}

export async function removeAssignment(liturgyId: string, partId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM assignments WHERE liturgy_id = ? AND part_id = ?;`,
    liturgyId,
    partId,
  );
}

/** Cascade: remove all assignments for a deacon at a liturgy. Used when a
 *  deacon's attendance flips from present to absent/excused/unmarked. */
export async function removeAssignmentsForDeacon(
  liturgyId: string,
  deaconId: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `DELETE FROM assignments WHERE liturgy_id = ? AND deacon_id = ?;`,
    liturgyId,
    deaconId,
  );
  return result.changes ?? 0;
}

export async function setAssignmentStatus(
  liturgyId: string,
  partId: string,
  status: AssignmentStatus,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE assignments SET status = ? WHERE liturgy_id = ? AND part_id = ?;`,
    status,
    liturgyId,
    partId,
  );
}

/** How many times a deacon has done a particular part. */
export async function getDeaconPartCounts(
  deaconId: string,
): Promise<Map<string, { count: number; lastDate: string | null }>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    part_id: string;
    n: number;
    last_date: string | null;
  }>(
    `SELECT a.part_id,
            COUNT(*) AS n,
            MAX(l.date) AS last_date
       FROM assignments a
       JOIN liturgies l ON l.id = a.liturgy_id
      WHERE a.deacon_id = ? AND l.status = 'held'
      GROUP BY a.part_id;`,
    deaconId,
  );
  const map = new Map<string, { count: number; lastDate: string | null }>();
  for (const r of rows) {
    map.set(r.part_id, { count: r.n, lastDate: r.last_date });
  }
  return map;
}

/**
 * For all deacons (active), how many times each has done a specific part —
 * used to rank candidates when assigning a new instance of that part.
 */
export async function getCandidateStatsForPart(
  partId: string,
): Promise<Map<string, { count: number; lastDate: string | null }>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    deacon_id: string;
    n: number;
    last_date: string | null;
  }>(
    `SELECT a.deacon_id,
            COUNT(*) AS n,
            MAX(l.date) AS last_date
       FROM assignments a
       JOIN liturgies l ON l.id = a.liturgy_id
      WHERE a.part_id = ? AND l.status = 'held'
      GROUP BY a.deacon_id;`,
    partId,
  );
  const map = new Map<string, { count: number; lastDate: string | null }>();
  for (const r of rows) {
    map.set(r.deacon_id, { count: r.n, lastDate: r.last_date });
  }
  return map;
}
