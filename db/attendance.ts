import { getDb } from './client';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

interface AttendanceRow {
  liturgy_id: string;
  deacon_id: string;
  status: AttendanceStatus;
  note: string | null;
  marked_at: number;
}

function fromRow(row: AttendanceRow): AttendanceRecord {
  return {
    liturgyId: row.liturgy_id,
    deaconId: row.deacon_id,
    status: row.status,
    note: row.note ?? undefined,
    markedAt: row.marked_at,
  };
}

export async function getAttendanceForLiturgy(liturgyId: string): Promise<AttendanceRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AttendanceRow>(
    `SELECT * FROM attendance WHERE liturgy_id = ?;`,
    liturgyId,
  );
  return rows.map(fromRow);
}

export async function getAttendanceForDeacon(deaconId: string): Promise<AttendanceRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<AttendanceRow>(
    `SELECT * FROM attendance WHERE deacon_id = ? ORDER BY marked_at DESC;`,
    deaconId,
  );
  return rows.map(fromRow);
}

/**
 * Set status for one (liturgy, deacon) pair. If `null`, the row is deleted
 * (= "unmarked"). Cascades a side-effect: when a deacon transitions away
 * from `present`, any assignments for that liturgy must be removed — the
 * caller is responsible for invoking `removeAssignmentsForDeacon` when this
 * happens (we expose that on assignments.ts so the side-effect is explicit
 * at the call site).
 */
export async function setAttendance(
  liturgyId: string,
  deaconId: string,
  status: AttendanceStatus | null,
  note?: string,
): Promise<void> {
  const db = await getDb();
  if (status === null) {
    await db.runAsync(
      `DELETE FROM attendance WHERE liturgy_id = ? AND deacon_id = ?;`,
      liturgyId,
      deaconId,
    );
    return;
  }
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO attendance (liturgy_id, deacon_id, status, note, marked_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(liturgy_id, deacon_id) DO UPDATE SET
       status = excluded.status,
       note = excluded.note,
       marked_at = excluded.marked_at;`,
    liturgyId,
    deaconId,
    status,
    note?.trim() || null,
    now,
  );
}

/** Replace the full attendance set for a liturgy. */
export async function replaceAttendanceForLiturgy(
  liturgyId: string,
  records: { deaconId: string; status: AttendanceStatus; note?: string }[],
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM attendance WHERE liturgy_id = ?;`, liturgyId);
    for (const r of records) {
      await db.runAsync(
        `INSERT INTO attendance (liturgy_id, deacon_id, status, note, marked_at)
         VALUES (?, ?, ?, ?, ?);`,
        liturgyId,
        r.deaconId,
        r.status,
        r.note?.trim() || null,
        now,
      );
    }
  });
}

export async function getPresentDeaconIds(liturgyId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ deacon_id: string }>(
    `SELECT deacon_id FROM attendance WHERE liturgy_id = ? AND status = 'present';`,
    liturgyId,
  );
  return new Set(rows.map((r) => r.deacon_id));
}

export async function getAttendanceStatusFor(
  liturgyId: string,
  deaconId: string,
): Promise<AttendanceStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ status: AttendanceStatus }>(
    `SELECT status FROM attendance WHERE liturgy_id = ? AND deacon_id = ?;`,
    liturgyId,
    deaconId,
  );
  return row?.status ?? null;
}
