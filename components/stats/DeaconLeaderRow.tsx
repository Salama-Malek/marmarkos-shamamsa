import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import { formatNumber } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import { formatArabicDate } from '@/lib/date';
import type { DeaconStats } from '@/types';

interface Props {
  rank: number;
  stats: DeaconStats;
  onPress: () => void;
  /** When true, render the rank as a small `#N` marker at the end side
   *  (Arabic visual left). When false, hide the marker — useful for the
   *  "never-assigned" list where ordering by rank is meaningless. */
  showRank?: boolean;
}

function DeaconLeaderRowImpl({ rank, stats, onPress, showRank = true }: Props) {
  const { style: numStyle } = useNumerals();
  const { deacon, assignmentsCount, perPart, lastAttendedDate } = stats;

  // Top part this deacon does (most-frequent first per the SQL ORDER BY).
  const topPart = perPart[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.92 } : undefined]}
      accessibilityRole="button"
      accessibilityLabel={deacon.name}
    >
      <Avatar name={deacon.name} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[text.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {deacon.name}
          </Text>
          <Pill
            label={ar.assignment.countTimes(formatNumber(assignmentsCount, numStyle))}
            tone="primary"
          />
        </View>
        {topPart ? (
          <Text style={[text.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {topPart.partName}
            {topPart.lastDate
              ? ` · ${ar.assignment.lastTime(formatArabicDate(topPart.lastDate, numStyle))}`
              : ''}
          </Text>
        ) : lastAttendedDate ? (
          <Text style={[text.caption, { color: colors.textMuted }]} numberOfLines={1}>
            آخر حضور: {formatArabicDate(lastAttendedDate, numStyle)}
          </Text>
        ) : (
          <Text style={[text.caption, { color: colors.textSubtle }]}>{ar.stats.notRecorded}</Text>
        )}
      </View>
      {showRank ? (
        <Text style={styles.rank}>#{formatNumber(rank, numStyle)}</Text>
      ) : null}
    </Pressable>
  );
}

export const DeaconLeaderRow = memo(DeaconLeaderRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rank: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: colors.textSubtle,
    minWidth: 28,
    textAlign: 'center',
  },
});
