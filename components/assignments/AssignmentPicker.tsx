import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X as XIcon } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { CenteredSpinner } from '@/components/ui/CenteredSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

import { getCandidateStatsForPart } from '@/db/assignments';
import { rankCandidates, type RankedCandidate } from '@/lib/distribution';
import { ar } from '@/lib/i18n';
import { formatNumber } from '@/lib/numerals';
import { useNumerals } from '@/lib/numeralsContext';
import { formatArabicDate } from '@/lib/date';
import { colors, radii, spacing, text } from '@/theme';
import type { Deacon, Part } from '@/types';

interface Props {
  visible: boolean;
  /** The part being assigned. */
  part: Part | null;
  /** Deacons currently marked PRESENT for this liturgy. */
  presentDeacons: Deacon[];
  onPick: (deaconId: string) => void;
  onClose: () => void;
}

export function AssignmentPicker({ visible, part, presentDeacons, onPick, onClose }: Props) {
  const { style: numStyle } = useNumerals();
  const [history, setHistory] = useState<Map<string, { count: number; lastDate: string | null }> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !part) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const map = await getCandidateStatsForPart(part.id);
      if (!cancelled) {
        setHistory(map);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, part]);

  const ranked = useMemo<RankedCandidate[]>(() => {
    if (!history) return [];
    return rankCandidates(presentDeacons, history);
  }, [history, presentDeacons]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[text.heading, styles.title]} numberOfLines={1}>
                {part?.arName ?? ''}
              </Text>
              <Text style={[text.small, styles.subtitle]}>{ar.assignment.onlyPresentDeacons}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel={ar.actions.close}
              style={styles.closeBtn}
            >
              <XIcon size={22} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <CenteredSpinner />
          ) : presentDeacons.length === 0 ? (
            <View style={styles.empty}>
              <EmptyState title={ar.assignment.cannotAssignAbsent} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {ranked.map((c) => (
                <CandidateRow
                  key={c.deacon.id}
                  candidate={c}
                  numStyle={numStyle}
                  onPress={() => onPick(c.deacon.id)}
                />
              ))}
              <View style={{ height: spacing.xl }} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CandidateRow({
  candidate,
  numStyle,
  onPress,
}: {
  candidate: RankedCandidate;
  numStyle: 'arabic' | 'western';
  onPress: () => void;
}) {
  const { deacon, count, lastDate, badge } = candidate;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.92 } : undefined]}
      accessibilityRole="button"
      accessibilityLabel={deacon.name}
    >
      <Avatar name={deacon.name} size={40} />
      <View style={styles.rowBody}>
        <Text style={[text.bodyMedium, { color: colors.text }]} numberOfLines={1}>
          {deacon.name}
        </Text>
        <Text style={[text.caption, { color: colors.textMuted }]} numberOfLines={1}>
          {count === 0
            ? '—'
            : lastDate
              ? `${ar.assignment.countTimes(formatNumber(count, numStyle))} · ${ar.assignment.lastTime(
                  formatArabicDate(lastDate, numStyle),
                )}`
              : ar.assignment.countTimes(formatNumber(count, numStyle))}
        </Text>
      </View>
      {badge ? (
        <Pill label={badgeLabel(badge)} tone={badgeTone(badge)} />
      ) : null}
    </Pressable>
  );
}

function badgeLabel(badge: NonNullable<RankedCandidate['badge']>): string {
  switch (badge) {
    case 'first-time':
      return ar.assignment.firstTime;
    case 'rare':
      return ar.assignment.rarely;
    case 'long-time':
      return ar.assignment.longTime;
  }
}

function badgeTone(badge: NonNullable<RankedCandidate['badge']>): React.ComponentProps<typeof Pill>['tone'] {
  switch (badge) {
    case 'first-time':
      return 'gold';
    case 'rare':
      return 'excused';
    case 'long-time':
      return 'primary';
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 8, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  empty: {
    flex: 1,
    minHeight: 220,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
});
