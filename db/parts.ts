import { getDb } from './client';
import { newId } from '@/lib/id';
import type { Part, PartCategory, PartScope } from '@/types';

interface PartRow {
  id: string;
  ar_name: string;
  category: PartCategory;
  scope: PartScope;
  sort_order: number;
  is_active: number;
  is_seeded: number;
  created_at: number;
  updated_at: number;
}

function fromRow(row: PartRow): Part {
  return {
    id: row.id,
    arName: row.ar_name,
    category: row.category,
    scope: row.scope,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    isSeeded: row.is_seeded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllParts(opts: { onlyActive?: boolean } = {}): Promise<Part[]> {
  const db = await getDb();
  const where = opts.onlyActive ? 'WHERE is_active = 1' : '';
  const rows = await db.getAllAsync<PartRow>(
    `SELECT * FROM parts ${where} ORDER BY scope DESC, sort_order ASC, ar_name ASC;`,
  );
  return rows.map(fromRow);
}

export async function listGeneralParts(opts: { onlyActive?: boolean } = {}): Promise<Part[]> {
  const db = await getDb();
  const activeClause = opts.onlyActive ? 'AND is_active = 1' : '';
  const rows = await db.getAllAsync<PartRow>(
    `SELECT * FROM parts WHERE scope = 'general' ${activeClause} ORDER BY sort_order ASC, ar_name ASC;`,
  );
  return rows.map(fromRow);
}

export async function listPartsForFeast(feastId: string, opts: { onlyActive?: boolean } = {}): Promise<Part[]> {
  const db = await getDb();
  const activeClause = opts.onlyActive ? 'AND p.is_active = 1' : '';
  const rows = await db.getAllAsync<PartRow>(
    `SELECT p.* FROM parts p
       JOIN feast_parts fp ON fp.part_id = p.id
      WHERE fp.feast_id = ? ${activeClause}
      ORDER BY p.sort_order ASC, p.ar_name ASC;`,
    feastId,
  );
  return rows.map(fromRow);
}

/**
 * Parts available for a liturgy: all general parts, plus feast-only parts that
 * belong to the liturgy's feast (if any). Always filtered to active.
 */
export async function listPartsForLiturgy(feastId: string | null | undefined): Promise<Part[]> {
  const general = await listGeneralParts({ onlyActive: true });
  if (!feastId) return general;
  const feast = await listPartsForFeast(feastId, { onlyActive: true });
  // Combine, preserving order: general first then feast-only seasonal.
  return [...general, ...feast];
}

export async function getPart(id: string): Promise<Part | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PartRow>(`SELECT * FROM parts WHERE id = ?;`, id);
  return row ? fromRow(row) : null;
}

export interface PartInput {
  arName: string;
  category: PartCategory;
  scope: PartScope;
  /** Required when scope === 'feast'. Multiple feasts may share a part. */
  feastIds?: string[];
}

export async function createPart(input: PartInput): Promise<Part> {
  const db = await getDb();
  const now = Date.now();
  const id = newId();
  const last = await db.getFirstAsync<{ max: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) AS max FROM parts WHERE scope = ?;`,
    input.scope,
  );
  const sortOrder = (last?.max ?? 0) + 10;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO parts (id, ar_name, category, scope, sort_order, is_active, is_seeded, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?);`,
      id,
      input.arName.trim(),
      input.category,
      input.scope,
      sortOrder,
      now,
      now,
    );
    if (input.scope === 'feast' && input.feastIds && input.feastIds.length > 0) {
      for (const feastId of input.feastIds) {
        await db.runAsync(
          `INSERT INTO feast_parts (feast_id, part_id) VALUES (?, ?);`,
          feastId,
          id,
        );
      }
    }
  });
  const created = await getPart(id);
  if (!created) throw new Error('Failed to create part');
  return created;
}

export async function updatePart(
  id: string,
  input: Pick<PartInput, 'arName' | 'category'>,
): Promise<Part> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE parts SET ar_name = ?, category = ?, updated_at = ? WHERE id = ?;`,
    input.arName.trim(),
    input.category,
    now,
    id,
  );
  const updated = await getPart(id);
  if (!updated) throw new Error('Part not found');
  return updated;
}

export async function setPartActive(id: string, isActive: boolean): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE parts SET is_active = ?, updated_at = ? WHERE id = ?;`,
    isActive ? 1 : 0,
    now,
    id,
  );
}

export async function deletePart(id: string): Promise<void> {
  const db = await getDb();
  // Seeded parts are protected at the UI layer; the DAL allows deletion for
  // wipe/restore flows. ON DELETE CASCADE removes assignments + feast_parts.
  await db.runAsync(`DELETE FROM parts WHERE id = ?;`, id);
}

/** Set the full set of feasts a feast-scoped part belongs to. */
export async function setPartFeasts(partId: string, feastIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM feast_parts WHERE part_id = ?;`, partId);
    for (const feastId of feastIds) {
      await db.runAsync(
        `INSERT INTO feast_parts (feast_id, part_id) VALUES (?, ?);`,
        feastId,
        partId,
      );
    }
  });
}

export async function getFeastsForPart(partId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ feast_id: string }>(
    `SELECT feast_id FROM feast_parts WHERE part_id = ?;`,
    partId,
  );
  return rows.map((r) => r.feast_id);
}
