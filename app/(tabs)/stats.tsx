import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeaconLeaderRow } from '@/components/stats/DeaconLeaderRow';
import { PartStatsRow } from '@/components/stats/PartStatsRow';

import {
  getAllDeaconStats,
  getAllPartStats,
  getOverallStats,
  type OverallStats,
} from '@/db/stats';

import { ar } from '@/lib/i18n';
import { buildPeriod, type PeriodKey } from '@/lib/period';
import { formatNumber, formatPercent } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import { colors, spacing, text } from '@/theme';
import type { DeaconStats, PartStats } from '@/types';

const PERIOD_OPTIONS = [
  { value: 'all' as const, label: ar.stats.period.all },
  { value: 'thisYear' as const, label: ar.stats.period.thisYear },
  { value: 'last3Months' as const, label: ar.stats.period.last3Months },
];

const NEEDS_OPPORTUNITY_THRESHOLD = 3;

export default function StatsTab() {
  const router = useRouter();
  const { style: numStyle } = useNumerals();

  const [periodKey, setPeriodKey] = useState<PeriodKey>('all');
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [deaconStats, setDeaconStats] = useState<DeaconStats[]>([]);
  const [partStats, setPartStats] = useState<PartStats[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const period = buildPeriod(periodKey);
    const filter = { dateFrom: period.dateFrom, dateTo: period.dateTo };
    const [o, ds, ps] = await Promise.all([
      getOverallStats(filter),
      getAllDeaconStats(filter),
      getAllPartStats(filter),
    ]);
    setOverall(o);
    setDeaconStats(ds);
    setPartStats(ps);
    setLoading(false);
  }, [periodKey]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const activeDeacons = useMemo(
    () => deaconStats.filter((s) => s.deacon.isActive),
    [deaconStats],
  );

  const mostAssigned = useMemo(
    () =>
      [...activeDeacons]
        .filter((s) => s.assignmentsCount > 0)
        .sort((a, b) => b.assignmentsCount - a.assignmentsCount)
        .slice(0, 10),
    [activeDeacons],
  );

  const needsOpportunity = useMemo(
    () =>
      [...activeDeacons]
        .filter((s) => s.assignmentsCount > 0 && s.assignmentsCount < NEEDS_OPPORTUNITY_THRESHOLD)
        .sort((a, b) => a.assignmentsCount - b.assignmentsCount),
    [activeDeacons],
  );

  const neverAssigned = useMemo(
    () => activeDeacons.filter((s) => s.assignmentsCount === 0),
    [activeDeacons],
  );

  const partsByUsage = useMemo(
    () => [...partStats].sort((a, b) => b.totalAssignments - a.totalAssignments),
    [partStats],
  );

  const showEmpty =
    !loading && (!overall || (overall.liturgiesHeld === 0 && overall.totalAssignments === 0));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={ar.tabs.stats} subtitle={ar.app.subtitle} />

      <View style={styles.controls}>
        <FilterChips options={PERIOD_OPTIONS} value={periodKey} onChange={setPeriodKey} />
      </View>

      {showEmpty ? (
        <EmptyState title={ar.empty.stats} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {overall ? (
            <View style={styles.cardsRow}>
              <BigStatCard
                value={formatNumber(overall.activeDeacons, numStyle)}
                label={ar.stats.cards.activeDeacons}
              />
              <BigStatCard
                value={formatNumber(overall.liturgiesHeld, numStyle)}
                label={ar.stats.cards.liturgiesHeld}
              />
              <BigStatCard
                value={formatPercent(overall.averageAttendance, numStyle)}
                label={ar.stats.cards.averageAttendance}
                tone="primary"
              />
              <BigStatCard
                value={formatNumber(overall.totalAssignments, numStyle)}
                label={ar.stats.cards.totalAssignments}
                tone="primary"
              />
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.linkCard,
              pressed ? { opacity: 0.92 } : undefined,
            ]}
            accessibilityRole="button"
            accessibilityLabel={ar.stats.settings}
          >
            <View style={styles.linkIcon}>
              <SettingsIcon size={22} color={colors.gold} />
            </View>
            <View style={styles.linkBody}>
              <Text style={[text.bodyBold, { color: colors.text }]}>{ar.stats.settings}</Text>
              <Text style={[text.small, { color: colors.textMuted }]}>
                {ar.stats.settingsSubtitle}
              </Text>
            </View>
            <ChevronLeft size={20} color={colors.textSubtle} />
          </Pressable>

          <Text style={[text.subheading, styles.section]}>{ar.stats.sections.mostAssigned}</Text>
          <Card>
            {mostAssigned.length === 0 ? (
              <Text style={[text.body, styles.muted]}>{ar.empty.stats}</Text>
            ) : (
              mostAssigned.map((s, idx) => (
                <View key={s.deacon.id}>
                  {idx > 0 ? <View style={styles.divider} /> : null}
                  <DeaconLeaderRow
                    rank={idx + 1}
                    stats={s}
                    onPress={() =>
                      router.push({ pathname: '/deacon/[id]', params: { id: s.deacon.id } })
                    }
                  />
                </View>
              ))
            )}
          </Card>

          {needsOpportunity.length > 0 ? (
            <>
              <Text style={[text.subheading, styles.section]}>
                {ar.stats.sections.leastAssigned}
              </Text>
              <Card>
                {needsOpportunity.map((s, idx) => (
                  <View key={s.deacon.id}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <DeaconLeaderRow
                      rank={idx + 1}
                      stats={s}
                      showRank={false}
                      onPress={() =>
                        router.push({ pathname: '/deacon/[id]', params: { id: s.deacon.id } })
                      }
                    />
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {neverAssigned.length > 0 ? (
            <>
              <Text style={[text.subheading, styles.section]}>
                {ar.stats.sections.neverAssigned}
              </Text>
              <Card>
                {neverAssigned.map((s, idx) => (
                  <View key={s.deacon.id}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <DeaconLeaderRow
                      rank={idx + 1}
                      stats={s}
                      showRank={false}
                      onPress={() =>
                        router.push({ pathname: '/deacon/[id]', params: { id: s.deacon.id } })
                      }
                    />
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {partsByUsage.length > 0 ? (
            <>
              <Text style={[text.subheading, styles.section]}>{ar.stats.sections.perPart}</Text>
              <Card>
                {partsByUsage.map((p, idx) => (
                  <View key={p.part.id}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <PartStatsRow stats={p} />
                  </View>
                ))}
              </Card>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BigStatCard({
  value,
  label,
  tone = 'neutral',
}: {
  value: string;
  label: string;
  tone?: 'neutral' | 'primary';
}) {
  const palette =
    tone === 'primary'
      ? { bg: colors.primary, fg: colors.white, border: colors.primary }
      : { bg: colors.surface, fg: colors.text, border: colors.border };
  return (
    <View style={[bigCardStyles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[text.title, { color: palette.fg, fontSize: 26 }]}>{value}</Text>
      <Text
        style={[text.caption, { color: palette.fg }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </View>
  );
}

const bigCardStyles = StyleSheet.create({
  card: {
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  controls: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  section: {
    color: colors.text,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  muted: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  linkIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.goldLight,
  },
  linkBody: {
    flex: 1,
    gap: 2,
  },
});
