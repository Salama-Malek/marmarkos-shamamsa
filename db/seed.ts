// One-time seed of feasts and the canonical Coptic liturgical parts.
// Runs whenever NO seeded rows exist (covers first launch and post-reseed
// migrations like v2 which wipe the seeded set so an updated list takes
// effect). User-created rows (is_seeded=0) are preserved across re-seeds.
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

// General liturgy parts — appear on every liturgy (regular Sunday + feasts).
// Trimmed to the essentials per coordinator request: 5 readings + 3 inside-
// altar roles. Hymns/responses, outside-altar processional roles, and
// secondary readings (Psalm before Gospel, Arabic vs Coptic Gospel split)
// have been removed from the seed; the user can re-add any specific part
// via the Parts tab if needed.
const GENERAL_PARTS: SeedPart[] = [
  { arName: 'البولس', category: 'reading', sortOrder: 10 },
  { arName: 'الكاثوليكون', category: 'reading', sortOrder: 20 },
  { arName: 'الإبركسيس', category: 'reading', sortOrder: 30 },
  { arName: 'السنكسار', category: 'reading', sortOrder: 40 },
  { arName: 'الإنجيل', category: 'reading', sortOrder: 50 },

  // Inside-altar service roles (داخل الهيكل).
  { arName: 'حامل القارورة', category: 'service', sortOrder: 110 },
  { arName: 'حامل الإباركة (للماء)', category: 'service', sortOrder: 120 },
  { arName: 'خادم المذبح', category: 'service', sortOrder: 130 },
];

// Comprehensive feast list. Ordered by liturgical year (~Coptic calendar).
// Feasts that have no extra assignable parts beyond the general 5+3 still
// appear in the list because tagging a liturgy with the feast lets the user
// filter views and (later) attach feast-specific notes. The user can hide
// feasts they don't celebrate by deactivating them via the Parts tab.
const FEASTS: SeedFeast[] = [
  // ── Christmas / Epiphany cycle ────────────────────────────────────────
  {
    arName: 'عيد الميلاد المجيد',
    sortOrder: 10,
    feastOnlyParts: [
      { arName: 'نبوة عشية الميلاد ١ (إشعياء ٧)', category: 'reading', sortOrder: 10 },
      { arName: 'نبوة عشية الميلاد ٢ (إشعياء ٩)', category: 'reading', sortOrder: 20 },
      { arName: 'نبوة عشية الميلاد ٣ (إشعياء ١١)', category: 'reading', sortOrder: 30 },
      { arName: 'نبوة عشية الميلاد ٤ (ميخا)', category: 'reading', sortOrder: 40 },
      { arName: 'نبوة عشية الميلاد ٥ (باروخ)', category: 'reading', sortOrder: 50 },
      { arName: 'نبوة عشية الميلاد ٦ (حزقيال)', category: 'reading', sortOrder: 60 },
      { arName: 'نبوة عشية الميلاد ٧ (حبقوق)', category: 'reading', sortOrder: 70 },
    ],
  },
  {
    arName: 'عيد الختان',
    sortOrder: 20,
  },
  {
    arName: 'عيد الغطاس',
    sortOrder: 30,
    feastOnlyParts: [
      // Bramoun (eve) — 7 prophecies.
      { arName: 'نبوة برمون الغطاس ١ (حبقوق)', category: 'reading', sortOrder: 10 },
      { arName: 'نبوة برمون الغطاس ٢ (إشعياء ٣٥)', category: 'reading', sortOrder: 20 },
      { arName: 'نبوة برمون الغطاس ٣ (إشعياء ٤٠)', category: 'reading', sortOrder: 30 },
      { arName: 'نبوة برمون الغطاس ٤ (إشعياء ٥٥)', category: 'reading', sortOrder: 40 },
      { arName: 'نبوة برمون الغطاس ٥ (باروخ)', category: 'reading', sortOrder: 50 },
      { arName: 'نبوة برمون الغطاس ٦ (حزقيال ٣٦)', category: 'reading', sortOrder: 60 },
      { arName: 'نبوة برمون الغطاس ٧ (مزمور)', category: 'reading', sortOrder: 70 },
      // Lakkan service.
      { arName: 'نبوة لقان الغطاس ١', category: 'reading', sortOrder: 110 },
      { arName: 'نبوة لقان الغطاس ٢', category: 'reading', sortOrder: 120 },
      { arName: 'نبوة لقان الغطاس ٣', category: 'reading', sortOrder: 130 },
      { arName: 'بولس لقان الغطاس', category: 'reading', sortOrder: 140 },
      { arName: 'كاثوليكون لقان الغطاس', category: 'reading', sortOrder: 150 },
      { arName: 'إنجيل لقان الغطاس الأول', category: 'reading', sortOrder: 160 },
      { arName: 'إنجيل لقان الغطاس الثاني', category: 'reading', sortOrder: 170 },
    ],
  },
  {
    arName: 'عرس قانا الجليل',
    sortOrder: 40,
  },
  {
    arName: 'دخول السيد المسيح أرض مصر',
    sortOrder: 50,
  },
  {
    arName: 'عيد التجلي',
    sortOrder: 60,
  },
  {
    arName: 'عيد البشارة',
    sortOrder: 70,
    feastOnlyParts: [
      { arName: 'مرد البشارة الخاص', category: 'response', sortOrder: 10 },
    ],
  },

  // ── Holy Week (البصخة) ────────────────────────────────────────────────
  {
    arName: 'سبت لعازر',
    sortOrder: 100,
  },
  {
    arName: 'أحد الشعانين',
    sortOrder: 110,
    feastOnlyParts: [
      { arName: 'إنجيل دورة الشعانين — متى', category: 'reading', sortOrder: 10 },
      { arName: 'إنجيل دورة الشعانين — مرقس', category: 'reading', sortOrder: 20 },
      { arName: 'إنجيل دورة الشعانين — لوقا', category: 'reading', sortOrder: 30 },
      { arName: 'إنجيل دورة الشعانين — يوحنا', category: 'reading', sortOrder: 40 },
      { arName: 'صلاة الجناز العام', category: 'response', sortOrder: 50 },
    ],
  },
  {
    arName: 'خميس العهد',
    sortOrder: 120,
    feastOnlyParts: [
      { arName: 'نبوة لقان خميس العهد ١ (إشعياء ٤)', category: 'reading', sortOrder: 10 },
      { arName: 'نبوة لقان خميس العهد ٢ (إشعياء ٥٥)', category: 'reading', sortOrder: 20 },
      { arName: 'نبوة لقان خميس العهد ٣ (حزقيال ٣٦)', category: 'reading', sortOrder: 30 },
      { arName: 'بولس لقان خميس العهد', category: 'reading', sortOrder: 40 },
      { arName: 'كاثوليكون لقان خميس العهد', category: 'reading', sortOrder: 50 },
      { arName: 'إنجيل لقان خميس العهد الأول (يو ١٣)', category: 'reading', sortOrder: 60 },
      { arName: 'إنجيل لقان خميس العهد الثاني (متى ٣)', category: 'reading', sortOrder: 70 },
    ],
  },
  {
    // Each hour has multiple prophecies that are distributed prophet-by-
    // prophet to different deacons. Seeded with 3 generic slots per hour;
    // the coordinator can rename each to the specific OT book/chapter on
    // the fly via the Parts tab.
    arName: 'الجمعة العظيمة',
    sortOrder: 130,
    feastOnlyParts: [
      { arName: 'نبوة الساعة الأولى ١', category: 'reading', sortOrder: 10 },
      { arName: 'نبوة الساعة الأولى ٢', category: 'reading', sortOrder: 20 },
      { arName: 'نبوة الساعة الأولى ٣', category: 'reading', sortOrder: 30 },
      { arName: 'إنجيل الساعة الأولى', category: 'reading', sortOrder: 40 },
      { arName: 'نبوة الساعة الثالثة ١', category: 'reading', sortOrder: 50 },
      { arName: 'نبوة الساعة الثالثة ٢', category: 'reading', sortOrder: 60 },
      { arName: 'نبوة الساعة الثالثة ٣', category: 'reading', sortOrder: 70 },
      { arName: 'إنجيل الساعة الثالثة', category: 'reading', sortOrder: 80 },
      { arName: 'نبوة الساعة السادسة ١', category: 'reading', sortOrder: 90 },
      { arName: 'نبوة الساعة السادسة ٢', category: 'reading', sortOrder: 100 },
      { arName: 'نبوة الساعة السادسة ٣', category: 'reading', sortOrder: 110 },
      { arName: 'إنجيل الساعة السادسة', category: 'reading', sortOrder: 120 },
      { arName: 'نبوة الساعة التاسعة ١', category: 'reading', sortOrder: 130 },
      { arName: 'نبوة الساعة التاسعة ٢', category: 'reading', sortOrder: 140 },
      { arName: 'نبوة الساعة التاسعة ٣', category: 'reading', sortOrder: 150 },
      { arName: 'قراءة اللص اليمين', category: 'reading', sortOrder: 160 },
      { arName: 'إنجيل الساعة التاسعة', category: 'reading', sortOrder: 170 },
      { arName: 'نبوة الساعة الحادية عشرة ١', category: 'reading', sortOrder: 180 },
      { arName: 'نبوة الساعة الحادية عشرة ٢', category: 'reading', sortOrder: 190 },
      { arName: 'نبوة الساعة الحادية عشرة ٣', category: 'reading', sortOrder: 200 },
      { arName: 'إنجيل الساعة الحادية عشرة', category: 'reading', sortOrder: 210 },
      { arName: 'نبوة الساعة الثانية عشرة ١', category: 'reading', sortOrder: 220 },
      { arName: 'نبوة الساعة الثانية عشرة ٢', category: 'reading', sortOrder: 230 },
      { arName: 'نبوة الساعة الثانية عشرة ٣', category: 'reading', sortOrder: 240 },
      { arName: 'إنجيل الساعة الثانية عشرة', category: 'reading', sortOrder: 250 },
      { arName: 'خدمة دفنة المسيح', category: 'service', sortOrder: 260 },
      { arName: 'قراءة كيريي إليسون (الـ٤٠٠)', category: 'response', sortOrder: 270 },
    ],
  },
  {
    // "Joy Saturday" / Apocalypse night — the book of Revelation is read
    // through, divided across multiple deacons.
    arName: 'سبت الفرح (أبوغلامسيس)',
    sortOrder: 140,
    feastOnlyParts: [
      { arName: 'إضاءة السبع قناديل والشموع', category: 'service', sortOrder: 10 },
      { arName: 'سفر الرؤيا — جزء ١ (إصحاحات ١-٤)', category: 'reading', sortOrder: 20 },
      { arName: 'سفر الرؤيا — جزء ٢ (إصحاحات ٥-١٠)', category: 'reading', sortOrder: 30 },
      { arName: 'سفر الرؤيا — جزء ٣ (إصحاحات ١١-١٦)', category: 'reading', sortOrder: 40 },
      { arName: 'سفر الرؤيا — جزء ٤ (إصحاحات ١٧-٢٢)', category: 'reading', sortOrder: 50 },
      { arName: 'تسبحة موسى (خروج ١٥)', category: 'response', sortOrder: 60 },
      { arName: 'تسبحة العذارى', category: 'response', sortOrder: 70 },
    ],
  },
  {
    arName: 'عيد القيامة المجيد',
    sortOrder: 150,
    feastOnlyParts: [
      { arName: 'إنجيل دورة القيامة ١ (متى ٢٨)', category: 'reading', sortOrder: 10 },
      { arName: 'إنجيل دورة القيامة ٢ (مرقس ١٦)', category: 'reading', sortOrder: 20 },
      { arName: 'إنجيل دورة القيامة ٣ (لوقا ٢٤)', category: 'reading', sortOrder: 30 },
      { arName: 'إنجيل دورة القيامة ٤ (يوحنا ٢٠)', category: 'reading', sortOrder: 40 },
      { arName: 'الحوار الطقسي (خرستوس آنستي)', category: 'response', sortOrder: 50 },
    ],
  },

  // ── Spring/summer cycle ───────────────────────────────────────────────
  {
    arName: 'عيد الصعود',
    sortOrder: 200,
  },
  {
    arName: 'عيد العنصرة',
    sortOrder: 210,
    feastOnlyParts: [
      { arName: 'مزمور السجدة الأولى', category: 'reading', sortOrder: 10 },
      { arName: 'إنجيل السجدة الأولى', category: 'reading', sortOrder: 20 },
      { arName: 'مزمور السجدة الثانية', category: 'reading', sortOrder: 30 },
      { arName: 'إنجيل السجدة الثانية', category: 'reading', sortOrder: 40 },
      { arName: 'مزمور السجدة الثالثة', category: 'reading', sortOrder: 50 },
      { arName: 'إنجيل السجدة الثالثة', category: 'reading', sortOrder: 60 },
    ],
  },
  {
    arName: 'عيد مارمرقس الرسول',
    sortOrder: 220,
    feastOnlyParts: [
      { arName: 'قراءة سيرة استشهاد مارمرقس', category: 'reading', sortOrder: 10 },
    ],
  },
  {
    // Apostles' Lakkan closes the Apostles' Fast (5 Abib).
    arName: 'عيد الرسل (لقان الرسل)',
    sortOrder: 230,
    feastOnlyParts: [
      { arName: 'نبوة لقان الرسل ١ (خروج ١٥)', category: 'reading', sortOrder: 10 },
      { arName: 'نبوة لقان الرسل ٢ (خروج ٣٠)', category: 'reading', sortOrder: 20 },
      { arName: 'نبوة لقان الرسل ٣ (إشعياء)', category: 'reading', sortOrder: 30 },
      { arName: 'نبوة لقان الرسل ٤ (إشعياء)', category: 'reading', sortOrder: 40 },
      { arName: 'نبوة لقان الرسل ٥ (إشعياء)', category: 'reading', sortOrder: 50 },
      { arName: 'نبوة لقان الرسل ٦ (زكريا)', category: 'reading', sortOrder: 60 },
      { arName: 'نبوة لقان الرسل ٧ (زكريا)', category: 'reading', sortOrder: 70 },
      { arName: 'بولس لقان الرسل', category: 'reading', sortOrder: 80 },
      { arName: 'كاثوليكون لقان الرسل', category: 'reading', sortOrder: 90 },
      { arName: 'إنجيل لقان الرسل الأول', category: 'reading', sortOrder: 100 },
      { arName: 'إنجيل لقان الرسل الثاني', category: 'reading', sortOrder: 110 },
      { arName: 'تسبحة موسى', category: 'response', sortOrder: 120 },
    ],
  },

  // ── Cross feasts (Tut 17 + Baramhat 10) ───────────────────────────────
  {
    arName: 'عيد الصليب',
    sortOrder: 300,
    feastOnlyParts: [
      { arName: 'إنجيل دورة الصليب ١', category: 'reading', sortOrder: 10 },
      { arName: 'إنجيل دورة الصليب ٢', category: 'reading', sortOrder: 20 },
      { arName: 'إنجيل دورة الصليب ٣', category: 'reading', sortOrder: 30 },
    ],
  },

  // ── Marian feasts ─────────────────────────────────────────────────────
  {
    arName: 'عيد ميلاد العذراء',
    sortOrder: 400,
  },
  {
    arName: 'عيد دخول العذراء الهيكل',
    sortOrder: 410,
  },
  {
    arName: 'عيد نياحة العذراء',
    sortOrder: 420,
  },
  {
    arName: 'عيد صعود جسد العذراء',
    sortOrder: 430,
  },
];

export async function runSeedIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  // Re-seed when the seeded set is missing (covers fresh installs and
  // post-reseed migrations such as v2). Counted on `is_seeded=1` so user
  // customs are never disturbed.
  const seededParts = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM parts WHERE is_seeded = 1;`,
  );
  const seededFeasts = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM feasts WHERE is_seeded = 1;`,
  );
  const partsEmpty = (seededParts?.n ?? 0) === 0;
  const feastsEmpty = (seededFeasts?.n ?? 0) === 0;
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
