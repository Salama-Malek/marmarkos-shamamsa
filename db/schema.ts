// SQLite schema and migrations for the deacons/liturgies app.
//
// Domain model:
//  - `feasts`         predefined major feasts (Nativity, Resurrection, …).
//                     Cannot be deleted if any liturgy references them; the
//                     parts list per feast is editable.
//  - `parts`          assignable liturgical parts (readings/responses/roles).
//                     A part is either "general" (available on every liturgy)
//                     or "feast-only" (only available when assigning for the
//                     matching feast). Parts can be soft-disabled via
//                     `is_active` instead of deleted to preserve history.
//  - `feast_parts`    which feast-only parts belong to which feast (many-to-
//                     many; allows the same custom part to appear on multiple
//                     feasts — uncommon but cheap to support).
//  - `deacons`        people assignable to parts (no rank field per spec).
//  - `liturgies`      a single service on a date. Optionally tagged with a
//                     `feast_id` so the part picker can show feast-only parts.
//  - `attendance`     present/absent/excused per (liturgy, deacon).
//  - `assignments`    "deacon X is doing part P at liturgy L". A deacon can do
//                     multiple parts per liturgy (PRIMARY KEY allows it: the
//                     unique key is (liturgy, part), not (liturgy, deacon)).
//                     Validation is enforced in the DAL — assignments must
//                     reference a deacon marked PRESENT for that liturgy.

export const SCHEMA_V1 = [
  `CREATE TABLE IF NOT EXISTS feasts (
    id TEXT PRIMARY KEY,
    ar_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_seeded INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    ar_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('reading','response','service','seasonal')),
    scope TEXT NOT NULL CHECK(scope IN ('general','feast')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_seeded INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_parts_active ON parts(is_active);`,
  `CREATE INDEX IF NOT EXISTS idx_parts_scope ON parts(scope);`,

  // Many-to-many for feast-scoped parts → feasts.
  `CREATE TABLE IF NOT EXISTS feast_parts (
    feast_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    PRIMARY KEY (feast_id, part_id),
    FOREIGN KEY (feast_id) REFERENCES feasts(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_feast_parts_part ON feast_parts(part_id);`,

  `CREATE TABLE IF NOT EXISTS deacons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    joined_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    archived_at INTEGER
  );`,
  `CREATE INDEX IF NOT EXISTS idx_deacons_active ON deacons(is_active);`,

  `CREATE TABLE IF NOT EXISTS liturgies (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    feast_id TEXT,
    title TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','cancelled')),
    cancellation_reason TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (feast_id) REFERENCES feasts(id) ON DELETE SET NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_liturgies_date ON liturgies(date DESC);`,

  `CREATE TABLE IF NOT EXISTS attendance (
    liturgy_id TEXT NOT NULL,
    deacon_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('present','absent','excused')),
    note TEXT,
    marked_at INTEGER NOT NULL,
    PRIMARY KEY (liturgy_id, deacon_id),
    FOREIGN KEY (liturgy_id) REFERENCES liturgies(id) ON DELETE CASCADE,
    FOREIGN KEY (deacon_id) REFERENCES deacons(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_deacon ON attendance(deacon_id);`,

  `CREATE TABLE IF NOT EXISTS assignments (
    liturgy_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    deacon_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','done','skipped')),
    note TEXT,
    assigned_at INTEGER NOT NULL,
    PRIMARY KEY (liturgy_id, part_id),
    FOREIGN KEY (liturgy_id) REFERENCES liturgies(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (deacon_id) REFERENCES deacons(id) ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS idx_assignments_deacon ON assignments(deacon_id);`,
  `CREATE INDEX IF NOT EXISTS idx_assignments_part ON assignments(part_id);`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
];

export interface Migration {
  version: number;
  statements: string[];
}

// v2 wipes the v1 seed (general parts list shrunk to 5 readings + 3 inside-
// altar roles, and per-feast prophecies/Gospels expanded into one part per
// reader). User-created (is_seeded=0) rows are preserved. The seed function
// re-inserts the new canonical list on the next launch because both tables
// expose at least one is_seeded=0 row only if the user added customs.
const RESEED_V2 = [
  // CASCADE deletes feast_parts and assignments referencing seeded rows.
  `DELETE FROM parts WHERE is_seeded = 1;`,
  `DELETE FROM feasts WHERE is_seeded = 1;`,
];

export const MIGRATIONS: Migration[] = [
  { version: 1, statements: SCHEMA_V1 },
  { version: 2, statements: RESEED_V2 },
];

export const DB_NAME = 'marmarkos-shamamsa.db';
