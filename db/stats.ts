import { getDb } from './client';
import type { DeaconStats, PartStats } from '@/types';
import { listDeacons } from './deacons';
import { listAllParts } from './parts';

export interface OverallStats {
  activeDeacons: number;
  liturgiesHeld: number;
  liturgiesCancelled: number;
  totalAssignments: number;
  averageAttendance: number;
}

export interface PeriodFilter {
  /** ISO yyyy-mm-dd inclusive lower bound. */
  dateFrom?: string;
  /** ISO yyyy-mm-dd inclusive upper bound. */
  dateTo?: string;
}

function buildDateClause(prefix: string, period: PeriodFilter): { clause: string; params: string[] } {
  const where: string[] = [];
  const params: string[] = [];
  if (period.dateFrom) {
    where.push(`${prefix}.date >= ?`);
    params.push(period.dateFrom);
  }
  if (period.dateTo) {
    where.push(`${prefix}.date <= ?`);
    params.push(period.dateTo);
  }
  return { clause: where.join(' AND '), params };
}

export async function getOverallStats(period: PeriodFilter = {}): Promise<OverallStats> {
  const db = await getDb();
  const { clause, params } = buildDateClause('l', period);
  const dateWhere = clause ? `AND ${clause}` : '';

  const summary = await db.getFirstAsync<{
    held: number;
    cancelled: number;
    assignments_n: number;
  }>(
    `SELECT
       SUM(CASE WHEN l.status = 'held' THEN 1 ELSE 0 END) AS held,
       SUM(CASE WHEN l.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
       (SELECT COUNT(*) FROM assignments x
          JOIN liturgies ll ON ll.id = x.liturgy_id
          WHERE 1=1 ${clause ? 'AND ' + clause.replace(/\bl\./g, 'll.') : ''}) AS assignments_n
     FROM liturgies l
     WHERE 1=1 ${dateWhere};`,
    ...params,
    ...params,
  );

  const activeDeacons = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM deacons WHERE is_active = 1;`,
  );

  // Average attendance rate across liturgies in the period.
  const attendanceAvg = await db.getFirstAsync<{ avg: number | null }>(
    `SELECT AVG(rate) AS avg FROM (
        SELECT
          (SELECT CAST(COUNT(*) AS REAL) FROM attendance a WHERE a.liturgy_id = l.id AND a.status = 'present') /
          NULLIF((SELECT CAST(COUNT(*) AS REAL) FROM attendance a WHERE a.liturgy_id = l.id AND a.status IN ('present','absent','excused')), 0) AS rate
        FROM liturgies l
        WHERE l.status = 'held' ${dateWhere}
     );`,
    ...params,
  );

  return {
    activeDeacons: activeDeacons?.n ?? 0,
    liturgiesHeld: summary?.held ?? 0,
    liturgiesCancelled: summary?.cancelled ?? 0,
    totalAssignments: summary?.assignments_n ?? 0,
    averageAttendance: attendanceAvg?.avg ?? 0,
  };
}

export async function getDeaconStats(deaconId: string, period: PeriodFilter = {}): Promise<DeaconStats | null> {
  const all = await getAllDeaconStats(period);
  return all.find((s) => s.deacon.id === deaconId) ?? null;
}

export async function getAllDeaconStats(period: PeriodFilter = {}): Promise<DeaconStats[]> {
  const db = await getDb();
  const deacons = await listDeacons({ filter: 'all' });
  const parts = await listAllParts();
  const partsById = new Map(parts.map((p) => [p.id, p]));
  const { clause, params } = buildDateClause('l', period);
  const dateWhere = clause ? `AND ${clause}` : '';

  const result: DeaconStats[] = [];
  for (const deacon of deacons) {
    const heldRow = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM liturgies l WHERE l.status = 'held' ${dateWhere};`,
      ...params,
    );
    const liturgiesEligible = heldRow?.n ?? 0;

    const counts = await db.getFirstAsync<{
      present: number;
      absent: number;
      excused: number;
    }>(
      `SELECT
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
         SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
         SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) AS excused
       FROM attendance a
       JOIN liturgies l ON l.id = a.liturgy_id
       WHERE a.deacon_id = ? AND l.status = 'held' ${dateWhere};`,
      deacon.id,
      ...params,
    );

    const lastAttended = await db.getFirstAsync<{ d: string | null }>(
      `SELECT MAX(l.date) AS d
         FROM attendance a
         JOIN liturgies l ON l.id = a.liturgy_id
        WHERE a.deacon_id = ? AND a.status = 'present' AND l.status = 'held' ${dateWhere};`,
      deacon.id,
      ...params,
    );

    const perPartRows = await db.getAllAsync<{
      part_id: string;
      n: number;
      last_date: string | null;
    }>(
      `SELECT a.part_id,
              COUNT(*) AS n,
              MAX(l.date) AS last_date
         FROM assignments a
         JOIN liturgies l ON l.id = a.liturgy_id
        WHERE a.deacon_id = ? AND l.status = 'held' ${dateWhere}
        GROUP BY a.part_id
        ORDER BY n DESC;`,
      deacon.id,
      ...params,
    );

    const present = counts?.present ?? 0;
    const absent = counts?.absent ?? 0;
    const excused = counts?.excused ?? 0;
    const denom = present + absent + excused;
    const attendanceRate = denom > 0 ? present / denom : 0;
    const assignmentsCount = perPartRows.reduce((acc, r) => acc + r.n, 0);

    result.push({
      deacon,
      liturgiesEligible,
      presentCount: present,
      absentCount: absent,
      excusedCount: excused,
      attendanceRate,
      assignmentsCount,
      perPart: perPartRows.map((r) => ({
        partId: r.part_id,
        partName: partsById.get(r.part_id)?.arName ?? r.part_id,
        count: r.n,
        lastDate: r.last_date ?? undefined,
      })),
      lastAttendedDate: lastAttended?.d ?? undefined,
    });
  }
  return result;
}

export async function getAllPartStats(period: PeriodFilter = {}): Promise<PartStats[]> {
  const db = await getDb();
  const parts = await listAllParts();
  const { clause, params } = buildDateClause('l', period);
  const dateWhere = clause ? `AND ${clause}` : '';

  const result: PartStats[] = [];
  for (const part of parts) {
    const row = await db.getFirstAsync<{
      total: number;
      uniq: number;
      last: string | null;
    }>(
      `SELECT
         COUNT(*) AS total,
         COUNT(DISTINCT a.deacon_id) AS uniq,
         MAX(l.date) AS last
       FROM assignments a
       JOIN liturgies l ON l.id = a.liturgy_id
       WHERE a.part_id = ? AND l.status = 'held' ${dateWhere};`,
      part.id,
      ...params,
    );
    result.push({
      part,
      totalAssignments: row?.total ?? 0,
      uniqueDeacons: row?.uniq ?? 0,
      lastAssignedDate: row?.last ?? undefined,
    });
  }
  return result;
}
