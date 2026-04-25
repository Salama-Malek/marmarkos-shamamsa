import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Pencil } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';

import { getDeacon } from '@/db/deacons';
import { getDeaconStats } from '@/db/stats';
import { ar } from '@/lib/i18n';
import { formatNumber, formatPercent } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import { formatArabicDate } from '@/lib/date';
import { colors, spacing, text } from '@/theme';
import type { Deacon, DeaconStats } from '@/types';

export default function DeaconDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { style: numStyle } = useNumerals();

  const [deacon, setDeacon] = useState<Deacon | null>(null);
  const [stats, setStats] = useState<DeaconStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (!id) return;
        setLoading(true);
        const [d, s] = await Promise.all([getDeacon(id), getDeaconStats(id)]);
        if (cancelled) return;
        setDeacon(d);
        setStats(s);
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  if (loading || !deacon) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={ar.tabs.deacons}
          showCross={false}
          right={<BackChevron onPress={() => router.back()} />}
        />
        <CenteredSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={deacon.name}
        showCross={false}
        right={<BackChevron onPress={() => router.back()} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.profile}>
            <Avatar name={deacon.name} size={56} />
            <View style={styles.profileBody}>
              <Text style={[text.title, styles.profileName]}>{deacon.name}</Text>
              <View style={styles.metaRow}>
                {!deacon.isActive ? (
                  <Pill label={ar.deacon.archived} tone="cancelled" />
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/deacon/[id]/edit', params: { id: deacon.id } })
              }
              hitSlop={10}
              accessibilityLabel={ar.actions.edit}
              style={styles.editBtn}
            >
              <Pencil size={20} color={colors.primary} />
            </Pressable>
          </View>

          {deacon.phone ? <InfoRow label={ar.deacon.phone} value={deacon.phone} /> : null}
          {deacon.joinedDate ? (
            <InfoRow
              label={ar.deacon.joinedDate}
              value={formatArabicDate(deacon.joinedDate, numStyle)}
            />
          ) : null}
          {deacon.notes ? <InfoRow label={ar.deacon.notes} value={deacon.notes} multiline /> : null}
        </Card>

        {stats ? (
          <>
            <Text style={[text.subheading, styles.section]}>الحضور</Text>
            <Card>
              <View style={styles.statsGrid}>
                <StatTile
                  label={ar.liturgy.summaryPresent}
                  value={formatNumber(stats.presentCount, numStyle)}
                  tone="present"
                />
                <StatTile
                  label={ar.liturgy.summaryAbsent}
                  value={formatNumber(stats.absentCount, numStyle)}
                  tone="absent"
                />
                <StatTile
                  label={ar.liturgy.summaryExcused}
                  value={formatNumber(stats.excusedCount, numStyle)}
                  tone="excused"
                />
                <StatTile
                  label="نسبة الحضور"
                  value={formatPercent(stats.attendanceRate, numStyle)}
                  tone="primary"
                />
              </View>
              {stats.lastAttendedDate ? (
                <Text style={[text.small, styles.lastDate]}>
                  آخر حضور: {formatArabicDate(stats.lastAttendedDate, numStyle)}
                </Text>
              ) : null}
            </Card>

            <Text style={[text.subheading, styles.section]}>التكليفات</Text>
            {stats.perPart.length === 0 ? (
              <Card>
                <Text style={[text.body, styles.muted]}>{ar.assignment.noAssignments}</Text>
              </Card>
            ) : (
              <Card>
                {stats.perPart.map((entry, idx) => (
                  <View key={entry.partId}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.partRow}>
                      <View style={styles.partBody}>
                        <Text style={[text.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                          {entry.partName}
                        </Text>
                        {entry.lastDate ? (
                          <Text style={[text.caption, { color: colors.textMuted }]}>
                            آخر مرة: {formatArabicDate(entry.lastDate, numStyle)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.countBadge}>
                        <Text style={[text.bodyBold, { color: colors.primary }]}>
                          {formatNumber(entry.count, numStyle)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
          </>
        ) : (
          <EmptyState title={ar.empty.stats} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[text.small, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[text.body, { color: colors.text, flex: 1, textAlign: 'left' }]}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'present' | 'absent' | 'excused' | 'primary';
}) {
  const palette = (() => {
    switch (tone) {
      case 'present':
        return { bg: colors.presentBg, fg: colors.present, border: colors.present };
      case 'absent':
        return { bg: colors.absentBg, fg: colors.absent, border: colors.absent };
      case 'excused':
        return { bg: colors.excusedBg, fg: colors.goldDeep, border: colors.gold };
      case 'primary':
      default:
        return { bg: colors.primary, fg: colors.white, border: colors.primary };
    }
  })();
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[text.title, { color: palette.fg, fontSize: 22 }]}>{value}</Text>
      <Text style={[text.caption, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

function BackChevron({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={ar.actions.back}>
      <ChevronRight size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  profileBody: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  editBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statTile: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  lastDate: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  section: {
    color: colors.text,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  partBody: {
    flex: 1,
    gap: 2,
  },
  countBadge: {
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  muted: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
