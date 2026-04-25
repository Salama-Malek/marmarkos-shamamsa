import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import { formatNumber } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import { formatArabicDate } from '@/lib/date';
import type { PartStats, PartCategory } from '@/types';

interface Props {
  stats: PartStats;
}

function PartStatsRowImpl({ stats }: Props) {
  const { style: numStyle } = useNumerals();
  const tone = toneFor(stats.part.category);

  return (
    <View style={styles.row}>
      <Pill label={ar.part.categories[stats.part.category]} tone={tone} />
      <View style={styles.body}>
        <Text style={[text.bodyMedium, { color: colors.text }]} numberOfLines={1}>
          {stats.part.arName}
        </Text>
        <Text style={[text.caption, { color: colors.textMuted }]} numberOfLines={1}>
          {ar.assignment.countTimes(formatNumber(stats.totalAssignments, numStyle))}
          {stats.uniqueDeacons > 0
            ? ` · ${formatNumber(stats.uniqueDeacons, numStyle)} شخص`
            : ''}
          {stats.lastAssignedDate
            ? ` · ${ar.assignment.lastTime(formatArabicDate(stats.lastAssignedDate, numStyle))}`
            : ''}
        </Text>
      </View>
    </View>
  );
}

export const PartStatsRow = memo(PartStatsRowImpl);

function toneFor(category: PartCategory): React.ComponentProps<typeof Pill>['tone'] {
  switch (category) {
    case 'reading':
      return 'primary';
    case 'response':
      return 'gold';
    case 'service':
      return 'neutral';
    case 'seasonal':
      return 'excused';
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
