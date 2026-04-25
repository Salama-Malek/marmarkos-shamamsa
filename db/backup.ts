// Export / import the full database as JSON. Mirrors the existing
// marmarkos-moscow-youth backup format conceptually, but the schema differs.
//
// Format (envelope):
//   {
//     "kind": "marmarkos-shamamsa-backup",
//     "schema": 1,
//     "exportedAt": <ms>,
//     "appVersion": "x.y.z",
//     "data": { feasts: [...], parts: [...], feastParts: [...], deacons: [...],
//               liturgies: [...], attendance: [...], assignments: [...] }
//   }
//
// Restore validates the envelope and replays inserts inside one transaction.
// Auto-recovery snapshot is written before any destructive restore so the
// user can roll back via the settings screen.

import { getDb, withTransaction } from './client';

export const BACKUP_KIND = 'marmarkos-shamamsa-backup';
export const BACKUP_SCHEMA = 1;

export class InvalidBackupError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidBackupError';
  }
}

interface BackupEnvelope {
  kind: string;
  schema: number;
  exportedAt: number;
  appVersion: string;
  data: BackupData;
}

interface BackupData {
  feasts: Record<string, unknown>[];
  parts: Record<string, unknown>[];
  feastParts: Record<string, unknown>[];
  deacons: Record<string, unknown>[];
  liturgies: Record<string, unknown>[];
  attendance: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
}

export async function exportAllAsJson(appVersion: string): Promise<BackupEnvelope> {
  const db = await getDb();
  const feasts = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM feasts;`);
  const parts = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM parts;`);
  const feastParts = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM feast_parts;`);
  const deacons = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM deacons;`);
  const liturgies = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM liturgies;`);
  const attendance = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM attendance;`);
  const assignments = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM assignments;`);
  return {
    kind: BACKUP_KIND,
    schema: BACKUP_SCHEMA,
    exportedAt: Date.now(),
    appVersion,
    data: { feasts, parts, feastParts, deacons, liturgies, attendance, assignments },
  };
}

export interface RestoreResult {
  feasts: number;
  parts: number;
  feastParts: number;
  deacons: number;
  liturgies: number;
  attendance: number;
  assignments: number;
}

function validateEnvelope(value: unknown): asserts value is BackupEnvelope {
  if (!value || typeof value !== 'object') throw new InvalidBackupError('not an object');
  const v = value as Record<string, unknown>;
  if (v.kind !== BACKUP_KIND) throw new InvalidBackupError('wrong backup kind');
  if (typeof v.schema !== 'number') throw new InvalidBackupError('missing schema');
  if (!v.data || typeof v.data !== 'object') throw new InvalidBackupError('missing data');
  const d = v.data as Record<string, unknown>;
  for (const key of [
    'feasts',
    'parts',
    'feastParts',
    'deacons',
    'liturgies',
    'attendance',
    'assignments',
  ]) {
    if (!Array.isArray(d[key])) throw new InvalidBackupError(`data.${key} not array`);
  }
}

export async function restoreFromJson(jsonText: string): Promise<RestoreResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new InvalidBackupError('not valid JSON');
  }
  validateEnvelope(parsed);
  const env = parsed;

  return withTransaction(async (db) => {
    // Wipe existing data (preserve schema_meta + settings).
    await db.execAsync(`DELETE FROM assignments;`);
    await db.execAsync(`DELETE FROM attendance;`);
    await db.execAsync(`DELETE FROM liturgies;`);
    await db.execAsync(`DELETE FROM feast_parts;`);
    await db.execAsync(`DELETE FROM deacons;`);
    await db.execAsync(`DELETE FROM parts;`);
    await db.execAsync(`DELETE FROM feasts;`);

    let n = { feasts: 0, parts: 0, feastParts: 0, deacons: 0, liturgies: 0, attendance: 0, assignments: 0 };

    for (const f of env.data.feasts) {
      const r = f as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO feasts (id, ar_name, sort_order, is_seeded, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        String(r.id),
        String(r.ar_name),
        Number(r.sort_order ?? 0),
        Number(r.is_seeded ?? 0),
        Number(r.created_at ?? Date.now()),
        Number(r.updated_at ?? Date.now()),
      );
      n.feasts++;
    }

    for (const p of env.data.parts) {
      const r = p as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO parts (id, ar_name, category, scope, sort_order, is_active, is_seeded, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        String(r.id),
        String(r.ar_name),
        String(r.category),
        String(r.scope),
        Number(r.sort_order ?? 0),
        Number(r.is_active ?? 1),
        Number(r.is_seeded ?? 0),
        Number(r.created_at ?? Date.now()),
        Number(r.updated_at ?? Date.now()),
      );
      n.parts++;
    }

    for (const fp of env.data.feastParts) {
      const r = fp as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO feast_parts (feast_id, part_id) VALUES (?, ?);`,
        String(r.feast_id),
        String(r.part_id),
      );
      n.feastParts++;
    }

    for (const d of env.data.deacons) {
      const r = d as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO deacons (id, name, phone, notes, joined_date, is_active, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        String(r.id),
        String(r.name),
        (r.phone as string | null) ?? null,
        (r.notes as string | null) ?? null,
        (r.joined_date as string | null) ?? null,
        Number(r.is_active ?? 1),
        Number(r.created_at ?? Date.now()),
        Number(r.updated_at ?? Date.now()),
        (r.archived_at as number | null) ?? null,
      );
      n.deacons++;
    }

    for (const l of env.data.liturgies) {
      const r = l as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO liturgies (id, date, feast_id, title, notes, status, cancellation_reason, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        String(r.id),
        String(r.date),
        (r.feast_id as string | null) ?? null,
        (r.title as string | null) ?? null,
        (r.notes as string | null) ?? null,
        String(r.status ?? 'held'),
        (r.cancellation_reason as string | null) ?? null,
        Number(r.created_at ?? Date.now()),
        Number(r.updated_at ?? Date.now()),
      );
      n.liturgies++;
    }

    for (const a of env.data.attendance) {
      const r = a as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO attendance (liturgy_id, deacon_id, status, note, marked_at)
         VALUES (?, ?, ?, ?, ?);`,
        String(r.liturgy_id),
        String(r.deacon_id),
        String(r.status),
        (r.note as string | null) ?? null,
        Number(r.marked_at ?? Date.now()),
      );
      n.attendance++;
    }

    for (const a of env.data.assignments) {
      const r = a as Record<string, unknown>;
      await db.runAsync(
        `INSERT INTO assignments (liturgy_id, part_id, deacon_id, status, note, assigned_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        String(r.liturgy_id),
        String(r.part_id),
        String(r.deacon_id),
        String(r.status ?? 'planned'),
        (r.note as string | null) ?? null,
        Number(r.assigned_at ?? Date.now()),
      );
      n.assignments++;
    }

    return n;
  });
}

/** Wipe all user data (feasts/parts can be re-seeded by restarting the app). */
export async function wipeAllData(): Promise<void> {
  await withTransaction(async (db) => {
    await db.execAsync(`DELETE FROM assignments;`);
    await db.execAsync(`DELETE FROM attendance;`);
    await db.execAsync(`DELETE FROM liturgies;`);
    await db.execAsync(`DELETE FROM deacons;`);
    // Leave feasts and parts: they're either seeded or part of the app config.
  });
}
