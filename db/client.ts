import * as SQLite from 'expo-sqlite';
import { DB_NAME, MIGRATIONS } from './schema';
import { runSeedIfEmpty } from './seed';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await ensureMetaTable(db);
  await runMigrations(db);
  await runSeedIfEmpty(db);
  _db = db;
  return db;
}

async function ensureMetaTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_meta (version INTEGER PRIMARY KEY);`,
  );
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ version: number }>(
    `SELECT MAX(version) AS version FROM schema_meta;`,
  );
  return row?.version ?? 0;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const current = await getCurrentVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > current).sort(
    (a, b) => a.version - b.version,
  );
  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      for (const stmt of migration.statements) {
        await db.execAsync(stmt);
      }
      await db.runAsync(
        `INSERT INTO schema_meta (version) VALUES (?);`,
        migration.version,
      );
    });
  }
}

export async function withTransaction<T>(
  fn: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  let result!: T;
  await db.withTransactionAsync(async () => {
    result = await fn(db);
  });
  return result;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
