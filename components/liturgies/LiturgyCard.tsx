import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radii, spacing, text } from '@/theme';
import { CalendarTile } from './CalendarTile';
import { Pill } from '@/components/ui/Pill';
import { ar } from '@/lib/i18n';
import { arabicDayName } from '@/lib/date';
import { formatNumber } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import type { LiturgyListItem } from '@/db/liturgies';

interface Props {
  liturgy: LiturgyListItem;
  onPress: (liturgy: LiturgyListItem) => void;
  onLongPress?: (liturgy: LiturgyListItem) => void;
}

function LiturgyCardImpl({ liturgy, onPress, onLongPress }: Props) {
  const handlePress = useCallback(() => onPress(liturgy), [onPress, liturgy]);
  const handleLongPress = useCallback(
    () => onLongPress?.(liturgy),
    [onLongPress, liturgy],
  );
  const { style: numStyle } = useNumerals();
  const isCancelled = liturgy.status === 'cancelled';
  const day = arabicDayName(liturgy.date);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={liturgy.title || day}
      style={({ pressed }) => [
        styles.card,
        isCancelled ? styles.cardCancelled : undefined,
        pressed ? { opacity: 0.92 } : undefined,
      ]}
    >
      {/*
        RTL-natural order: date tile on visual right (Arabic start), body
        in middle. flexDirection:'row' auto-flips, so source order
        [tile, body] renders [right, left] in RTL.
      */}
      <CalendarTile date={liturgy.date} tone={isCancelled ? 'cancelled' : 'primary'} />
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text
            style={[text.bodyBold, styles.title, { color: isCancelled ? colors.textMuted : colors.text }]}
            numberOfLines={1}
          >
            {liturgy.title || day}
          </Text>
          {isCancelled ? <Pill label={ar.status.cancelled} tone="cancelled" /> : null}
        </View>
        {liturgy.feastName ? (
          <Text style={[text.small, styles.feast]} numberOfLines={1}>
            {liturgy.feastName}
          </Text>
        ) : (
          <Text style={[text.small, styles.feast]} numberOfLines={1}>
            {day}
          </Text>
        )}
        {isCancelled && liturgy.cancellationReason ? (
          <Text style={[text.small, styles.reason]} numberOfLines={2}>
            {liturgy.cancellationReason}
          </Text>
        ) : (
          <View style={styles.statsRow}>
            <StatDot
              color={colors.present}
              value={formatNumber(liturgy.counts.present, numStyle)}
              label={ar.liturgy.summaryPresent}
            />
            <StatDot
              color={colors.absent}
              value={formatNumber(liturgy.counts.absent, numStyle)}
              label={ar.liturgy.summaryAbsent}
            />
            <StatDot
              color={colors.gold}
              value={formatNumber(liturgy.assignmentsCount, numStyle)}
              label="تكليف"
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const LiturgyCard = memo(LiturgyCardImpl);

function StatDot({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <View style={styles.statDot}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[text.small, { color: colors.text, fontFamily: 'Cairo_600SemiBold' }]}>{value}</Text>
      <Text style={[text.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...(elevation.card as object),
  },
  cardCancelled: {
    backgroundColor: colors.bgDeep,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    flex: 1,
  },
  feast: {
    color: colors.textMuted,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reason: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  statDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
