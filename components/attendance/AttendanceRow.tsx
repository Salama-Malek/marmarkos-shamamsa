import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { StatusButton } from './StatusButton';
import { ar } from '@/lib/i18n';
import type { AttendanceStatus, Deacon } from '@/types';

interface Props {
  deacon: Deacon;
  status?: AttendanceStatus;
  /** Receives both ids so the parent can keep the callback stable. */
  onSetStatus: (deaconId: string, status: AttendanceStatus) => void;
  /** Number of assignments this deacon has at the current liturgy.
   *  When transitioning away from "present" with assignments > 0 the parent
   *  should warn before cascading the deletion. */
  assignmentsCount?: number;
}

function AttendanceRowImpl({ deacon, status, onSetStatus }: Props) {
  const stripeColor = stripeFor(status);
  const onPresent = useCallback(() => onSetStatus(deacon.id, 'present'), [onSetStatus, deacon.id]);
  const onAbsent = useCallback(() => onSetStatus(deacon.id, 'absent'), [onSetStatus, deacon.id]);
  const onExcused = useCallback(() => onSetStatus(deacon.id, 'excused'), [onSetStatus, deacon.id]);

  // Children listed in RTL-natural reading order: stripe → avatar → name →
  // buttons. flexDirection:'row' auto-flips so this also reads correctly
  // in environments where forceRTL hasn't applied yet (e.g. Expo Go).
  return (
    <View style={styles.row}>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      <Avatar name={deacon.name} size={36} />
      <Text style={[text.body, styles.name]} numberOfLines={1}>
        {deacon.name}
      </Text>
      <View style={styles.buttons}>
        <StatusButton
          tone="present"
          selected={status === 'present'}
          onPress={onPresent}
          accessibilityLabel={`${deacon.name} ${ar.status.present}`}
        />
        <StatusButton
          tone="absent"
          selected={status === 'absent'}
          onPress={onAbsent}
          accessibilityLabel={`${deacon.name} ${ar.status.absent}`}
        />
        <StatusButton
          tone="excused"
          selected={status === 'excused'}
          onPress={onExcused}
          accessibilityLabel={`${deacon.name} ${ar.status.excused}`}
        />
      </View>
    </View>
  );
}

export const AttendanceRow = memo(AttendanceRowImpl);

function stripeFor(status: AttendanceStatus | undefined): string {
  switch (status) {
    case 'present':
      return colors.present;
    case 'absent':
      return colors.absent;
    case 'excused':
      return colors.gold;
    default:
      return colors.border;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 64,
    paddingEnd: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
    marginEnd: spacing.xxs,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  name: {
    flex: 1,
    color: colors.text,
  },
});
