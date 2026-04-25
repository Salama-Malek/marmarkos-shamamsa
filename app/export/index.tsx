import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, FileDown } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DateField } from '@/components/ui/DateField';
import { useToast } from '@/components/ui/Toast';

import { getAllDeaconStats } from '@/db/stats';
import { listLiturgies, listLiturgyMonths } from '@/db/liturgies';
import { listDeacons } from '@/db/deacons';
import { getAttendanceForLiturgy } from '@/db/attendance';
import { getAssignmentsForLiturgyDetailed } from '@/db/assignments';

import { buildStatsWorkbook } from '@/lib/excel/statsExport';
import { buildLiturgyWorkbook, buildMonthlyWorkbook } from '@/lib/excel/liturgyExport';
import type { MonthlyMatrixData } from '@/lib/excel/liturgyExport';
import { buildStatsPdf } from '@/lib/pdf/statsPdf';
import { buildLiturgyPdf, buildMonthlyPdf } from '@/lib/pdf/liturgyPdf';
import { shareBase64, shareUri, MIME } from '@/lib/share';

import { ar } from '@/lib/i18n';
import { toIsoDate, formatArabicDateLong, arabicMonthYear } from '@/lib/date';
import { colors, spacing, text } from '@/theme';
import type { LiturgyListItem } from '@/db/liturgies';
import type { AttendanceStatus } from '@/types';

type Scope = 'all' | 'range' | 'month' | 'liturgy';
type ExportFormat = 'excel' | 'pdf';

export default function ExportScreen() {
  const router = useRouter();
  const toast = useToast();

  const [scope, setScope] = useState<Scope>('all');
  const [format, setFormat] = useState<ExportFormat>('excel');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [liturgies, setLiturgies] = useState<LiturgyListItem[]>([]);
  const [selectedLiturgy, setSelectedLiturgy] = useState<LiturgyListItem | null>(null);

  const [busy, setBusy] = useState(false);

  const today = toIsoDate(new Date());

  useEffect(() => {
    listLiturgyMonths().then(setMonths).catch(() => {});
    listLiturgies({}).then((ls) => setLiturgies([...ls].reverse())).catch(() => {});
  }, []);

  async function handleExport() {
    if (busy) return;

    if (scope === 'range' && (!dateFrom || !dateTo)) {
      toast.show(ar.export.errorNoRange, 'error');
      return;
    }
    if (scope === 'month' && !selectedMonth) {
      toast.show(ar.export.errorNoMonth, 'error');
      return;
    }
    if (scope === 'liturgy' && !selectedLiturgy) {
      toast.show(ar.export.errorNoLiturgy, 'error');
      return;
    }

    setBusy(true);
    try {
      if (scope === 'liturgy') {
        await exportLiturgy();
      } else if (scope === 'month') {
        await exportMonth();
      } else {
        await exportStats();
      }
      toast.show(ar.export.success, 'success');
    } catch (e) {
      toast.show(String(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function exportStats() {
    const period: { dateFrom?: string; dateTo?: string } = {};
    let periodLabel = ar.export.periodAll;

    if (scope === 'range') {
      period.dateFrom = dateFrom;
      period.dateTo = dateTo;
      periodLabel = ar.export.periodRange(
        formatArabicDateLong(dateFrom),
        formatArabicDateLong(dateTo),
      );
    }

    const [deaconStats, allLiturgies] = await Promise.all([
      getAllDeaconStats(period),
      listLiturgies({}),
    ]);

    const filtered =
      scope === 'range'
        ? allLiturgies.filter((l) => l.date >= dateFrom && l.date <= dateTo).reverse()
        : [...allLiturgies].reverse();

    if (format === 'excel') {
      const { base64, filename } = buildStatsWorkbook({ periodLabel, deaconStats, liturgies: filtered });
      await shareBase64(base64, filename, MIME.xlsx, ar.export.title);
    } else {
      const { uri } = await buildStatsPdf({ periodLabel, deaconStats, liturgies: filtered });
      await shareUri(uri, MIME.pdf, ar.export.title);
    }
  }

  async function exportMonth() {
    const ym = selectedMonth!;

    const [liturgyList, deacons] = await Promise.all([
      listLiturgies({ yearMonth: ym }),
      listDeacons({ filter: 'active' }),
    ]);

    const sorted = [...liturgyList].reverse();

    const attendanceArrays = await Promise.all(sorted.map((l) => getAttendanceForLiturgy(l.id)));

    const rows = deacons.map((deacon) => {
      const cells = new Map<string, AttendanceStatus | null>();
      let presentCount = 0;
      let eligibleHeld = 0;
      sorted.forEach((l, idx) => {
        if (l.status === 'cancelled') {
          cells.set(l.id, null);
        } else {
          eligibleHeld++;
          const record = (attendanceArrays[idx] ?? []).find((a) => a.deaconId === deacon.id);
          const status = record?.status ?? null;
          cells.set(l.id, status);
          if (status === 'present') presentCount++;
        }
      });
      return { deacon, cells, presentCount, eligibleHeld };
    });

    const matrixData: MonthlyMatrixData = {
      yearMonth: ym,
      liturgies: sorted.map((l) => ({
        id: l.id,
        date: l.date,
        status: l.status,
        feastName: l.feastName,
      })),
      rows,
    };

    if (format === 'excel') {
      const { base64, filename } = buildMonthlyWorkbook(matrixData);
      await shareBase64(base64, filename, MIME.xlsx, ar.export.title);
    } else {
      const { uri } = await buildMonthlyPdf(matrixData);
      await shareUri(uri, MIME.pdf, ar.export.title);
    }

  }

  async function exportLiturgy() {
    const liturgy = selectedLiturgy!;
    const [attendance, assignments, deacons] = await Promise.all([
      getAttendanceForLiturgy(liturgy.id),
      getAssignmentsForLiturgyDetailed(liturgy.id),
      listDeacons({ filter: 'active' }),
    ]);

    if (format === 'excel') {
      const { base64, filename } = buildLiturgyWorkbook({
        liturgy,
        feastName: liturgy.feastName,
        deacons,
        attendance,
        assignments,
      });
      await shareBase64(base64, filename, MIME.xlsx, ar.export.title);
    } else {
      const { uri } = await buildLiturgyPdf({
        liturgy,
        feastName: liturgy.feastName,
        deacons,
        attendance,
        assignments,
      });
      await shareUri(uri, MIME.pdf, ar.export.title);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={ar.export.title}
        showCross={false}
        right={
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={ar.actions.back}>
            <ChevronRight size={22} color={colors.text} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel>{ar.export.scopeLabel}</SectionLabel>
        <Card>
          <FilterChips<Scope>
            options={[
              { value: 'all', label: ar.export.scopeAll },
              { value: 'range', label: ar.export.scopeRange },
              { value: 'month', label: ar.export.scopeMonth },
              { value: 'liturgy', label: ar.export.scopeLiturgy },
            ]}
            value={scope}
            onChange={(s) => {
              setScope(s);
              setSelectedMonth(null);
              setSelectedLiturgy(null);
            }}
          />
        </Card>

        {scope === 'range' && (
          <Card style={styles.rangeCard}>
            <DateField
              label={ar.export.dateFrom}
              value={dateFrom}
              onChange={setDateFrom}
              maximumDate={new Date()}
              placeholder="اختر تاريخ البداية"
            />
            <View style={styles.rangeGap} />
            <DateField
              label={ar.export.dateTo}
              value={dateTo}
              onChange={setDateTo}
              minimumDate={dateFrom ? new Date(dateFrom) : undefined}
              maximumDate={new Date()}
              placeholder="اختر تاريخ النهاية"
            />
          </Card>
        )}

        {scope === 'month' && (
          <Card padded={false}>
            {months.length === 0 ? (
              <Text style={[text.body, styles.emptyPicker]}>{ar.empty.liturgies}</Text>
            ) : (
              months.map((ym) => {
                const selected = selectedMonth === ym;
                return (
                  <Pressable
                    key={ym}
                    onPress={() => setSelectedMonth(ym)}
                    style={({ pressed }) => [
                      styles.pickerRow,
                      selected && styles.pickerRowSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        text.body,
                        { color: selected ? colors.white : colors.text },
                      ]}
                    >
                      {arabicMonthYear(ym)}
                    </Text>
                    {selected && (
                      <Text style={[text.small, { color: colors.white }]}>✓</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </Card>
        )}

        {scope === 'liturgy' && (
          <Card padded={false}>
            {liturgies.length === 0 ? (
              <Text style={[text.body, styles.emptyPicker]}>{ar.empty.liturgies}</Text>
            ) : (
              liturgies.map((l) => {
                const selected = selectedLiturgy?.id === l.id;
                const label = l.title || (l.feastName ? `قداس ${l.feastName}` : ar.liturgy.detail);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setSelectedLiturgy(l)}
                    style={({ pressed }) => [
                      styles.pickerRow,
                      selected && styles.pickerRowSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={styles.pickerRowBody}>
                      <Text
                        style={[text.bodyMedium, { color: selected ? colors.white : colors.text }]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[text.small, { color: selected ? colors.goldLight : colors.textMuted }]}
                      >
                        {formatArabicDateLong(l.date)}
                      </Text>
                    </View>
                    {selected && (
                      <Text style={[text.small, { color: colors.white }]}>✓</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </Card>
        )}

        <SectionLabel>{ar.export.formatLabel}</SectionLabel>
        <Card>
          <SegmentedControl<ExportFormat>
            value={format}
            onChange={setFormat}
            options={[
              { value: 'excel', label: ar.export.formatExcel },
              { value: 'pdf', label: ar.export.formatPdf },
            ]}
          />
        </Card>

        <Button
          label={busy ? ar.export.exporting : ar.export.exportBtn}
          onPress={() => void handleExport()}
          loading={busy}
          fullWidth
          icon={<FileDown size={18} color={colors.white} />}
          style={styles.exportBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={[text.subheading, styles.sectionLabel]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  sectionLabel: {
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
    alignSelf: 'stretch',
  },
  rangeCard: {
    gap: spacing.xs,
  },
  rangeGap: { height: spacing.xs },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowSelected: {
    backgroundColor: colors.primary,
  },
  pickerRowBody: {
    flex: 1,
    gap: 2,
  },
  emptyPicker: {
    color: colors.textMuted,
    padding: spacing.md,
    textAlign: 'center',
  },
  exportBtn: {
    marginTop: spacing.sm,
  },
});
