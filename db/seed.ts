// One-time seed of feasts and the canonical Coptic liturgical parts.
// Runs only when both tables are empty (first launch / fresh install).
//
// Each seeded row is tagged `is_seeded=1` so the UI can render a small
// indicator and (optionally) prevent destructive deletion. Users can still
// soft-deactivate any part via `is_active=0`, and they can rename or reorder
// any seeded row.
//
// Sort order: liturgical sequence inside the service. Gaps of 10 between
// items leave room for user-added parts to be slotted in without renumbering.

import type * as SQLite from 'expo-sqlite';
import { newId } from '@/lib/id';

interface SeedFeast {
  arName: string;
  sortOrder: number;
  // Parts that activate ONLY on this feast (in addition to general parts).
  feastOnlyParts?: { arName: string; category: PartCategory; sortOrder: number }[];
}

interface SeedPart {
  arName: string;
  category: PartCategory;
  sortOrder: number;
}

type PartCategory = 'reading' | 'response' | 'service' | 'seasonal';

const GENERAL_PARTS: SeedPart[] = [
  // Liturgy of the Word — readings (in liturgical order).
  { arName: 'البولس', category: 'reading', sortOrder: 10 },
  { arName: 'الكاثوليكون', category: 'reading', sortOrder: 20 },
  { arName: 'الإبركسيس', category: 'reading', sortOrder: 30 },
  { arName: 'السنكسار', category: 'reading', sortOrder: 40 },
  { arName: 'مزمور الإنجيل', category: 'reading', sortOrder: 50 },
  { arName: 'الإنجيل العربي', category: 'reading', sortOrder: 60 },

  // Hymns and responses.
  { arName: 'مرد البولس', category: 'response', sortOrder: 110 },
  { arName: 'مرد الكاثوليكون', category: 'response', sortOrder: 120 },
  { arName: 'مرد الإبركسيس', category: 'response', sortOrder: 130 },
  { arName: 'أجيوس (تريصاجيون)', category: 'response', sortOrder: 140 },
  { arName: 'مرد الإنجيل', category: 'response', sortOrder: 150 },
  { arName: 'قانون الإيمان', category: 'response', sortOrder: 160 },
  { arName: 'أوشية السلامة', category: 'response', sortOrder: 170 },
  { arName: 'أوشية الآباء', category: 'response', sortOrder: 180 },
  { arName: 'أوشية الاجتماعات', category: 'response', sortOrder: 190 },
  { arName: 'الإسبسمس الآدام', category: 'response', sortOrder: 200 },
  { arName: 'الإسبسمس الواطس', category: 'response', sortOrder: 210 },
  { arName: 'مرد القداس', category: 'response', sortOrder: 220 },
  { arName: 'مرد القسمة', category: 'response', sortOrder: 230 },
  { arName: 'مزمور 150', category: 'response', sortOrder: 240 },
  { arName: 'مدائح التوزيع', category: 'response', sortOrder: 250 },
  { arName: 'ختام الخدمة', category: 'response', sortOrder: 260 },

  // Service roles (non-vocal).
  { arName: 'حامل الصليب', category: 'service', sortOrder: 310 },
  { arName: 'حامل الشموع', category: 'service', sortOrder: 320 },
  { arName: 'حامل المجمرة', category: 'service', sortOrder: 330 },
  { arName: 'حامل درج البخور', category: 'service', sortOrder: 340 },
  { arName: 'خادم المذبح', category: 'service', sortOrder: 350 },
  { arName: 'حامل الكأس', category: 'service', sortOrder: 360 },
  { arName: 'قارئ أسماء الراقدين', category: 'service', sortOrder: 370 },
];

const FEASTS: SeedFeast[] = [
  {
    arName: 'عيد الميلاد المجيد',
    sortOrder: 10,
    feastOnlyParts: [
      { arName: 'نبوات الميلاد', category: 'seasonal', sortOrder: 10 },
      { arName: 'مرد ميلادي خاص', category: 'seasonal', sortOrder: 20 },
    ],
  },
  {
    arName: 'عيد الغطاس',
    sortOrder: 20,
    feastOnlyParts: [
      { arName: 'نبوات الغطاس', category: 'seasonal', sortOrder: 10 },
      { arName: 'لقان الغطاس', category: 'seasonal', sortOrder: 20 },
      { arName: 'مرد غطاسي خاص', category: 'seasonal', sortOrder: 30 },
    ],
  },
  {
    arName: 'أحد الشعانين',
    sortOrder: 30,
    feastOnlyParts: [
      { arName: 'دورة الشعانين', category: 'seasonal', sortOrder: 10 },
      { arName: 'الإنجيل في المحطات', category: 'seasonal', sortOrder: 20 },
    ],
  },
  {
    arName: 'خميس العهد',
    sortOrder: 40,
    feastOnlyParts: [
      { arName: 'لقان خميس العهد', category: 'seasonal', sortOrder: 10 },
    ],
  },
  {
    arName: 'عيد القيامة المجيد',
    sortOrder: 50,
    feastOnlyParts: [
      { arName: 'دورة القيامة', category: 'seasonal', sortOrder: 10 },
      { arName: 'خرستوس آنستي', category: 'seasonal', sortOrder: 20 },
      { arName: 'مرد قيامي خاص', category: 'seasonal', sortOrder: 30 },
    ],
  },
  {
    arName: 'عيد العنصرة',
    sortOrder: 60,
    feastOnlyParts: [
      { arName: 'مرد العنصرة', category: 'seasonal', sortOrder: 10 },
      { arName: 'صلاة الركوع', category: 'seasonal', sortOrder: 20 },
    ],
  },
  {
    arName: 'عيد الصليب',
    sortOrder: 70,
    feastOnlyParts: [
      { arName: 'دورة الصليب', category: 'seasonal', sortOrder: 10 },
      { arName: 'مرد الصليب', category: 'seasonal', sortOrder: 20 },
    ],
  },
  {
    arName: 'عيد الرسل (لقان الرسل)',
    sortOrder: 80,
    feastOnlyParts: [
      { arName: 'لقان عيد الرسل', category: 'seasonal', sortOrder: 10 },
      { arName: 'تسبحة موسى', category: 'seasonal', sortOrder: 20 },
    ],
  },
  {
    arName: 'دخول السيد المسيح أرض مصر',
    sortOrder: 90,
  },
  {
    arName: 'عيد التجلي',
    sortOrder: 100,
  },
  {
    arName: 'عيد البشارة',
    sortOrder: 110,
  },
];

export async function runSeedIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const partsCount = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM parts;`,
  );
  const feastsCount = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM feasts;`,
  );
  const partsEmpty = (partsCount?.n ?? 0) === 0;
  const feastsEmpty = (feastsCount?.n ?? 0) === 0;
  if (!partsEmpty && !feastsEmpty) return;

  const now = Date.now();
  await db.withTransactionAsync(async () => {
    if (partsEmpty) {
      for (const p of GENERAL_PARTS) {
        await db.runAsync(
          `INSERT INTO parts (id, ar_name, category, scope, sort_order, is_active, is_seeded, created_at, updated_at)
           VALUES (?, ?, ?, 'general', ?, 1, 1, ?, ?);`,
          newId(),
          p.arName,
          p.category,
          p.sortOrder,
          now,
          now,
        );
      }
    }
    if (feastsEmpty) {
      for (const f of FEASTS) {
        const feastId = newId();
        await db.runAsync(
          `INSERT INTO feasts (id, ar_name, sort_order, is_seeded, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?);`,
          feastId,
          f.arName,
          f.sortOrder,
          now,
          now,
        );
        if (f.feastOnlyParts) {
          for (const p of f.feastOnlyParts) {
            const partId = newId();
            await db.runAsync(
              `INSERT INTO parts (id, ar_name, category, scope, sort_order, is_active, is_seeded, created_at, updated_at)
               VALUES (?, ?, ?, 'feast', ?, 1, 1, ?, ?);`,
              partId,
              p.arName,
              p.category,
              p.sortOrder,
              now,
              now,
            );
            await db.runAsync(
              `INSERT INTO feast_parts (feast_id, part_id) VALUES (?, ?);`,
              feastId,
              partId,
            );
          }
        }
      }
    }
  });
}
