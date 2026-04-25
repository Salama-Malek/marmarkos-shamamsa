import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { ar } from '@/lib/i18n';
import { fromIsoDate, toIsoDate, formatArabicDateLong } from '@/lib/date';
import { useNumerals } from '@/lib/numeralsContext';

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function DateRow({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const { style: numStyle } = useNumerals();

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !picked) return;
    onChange(toIsoDate(picked));
  }

  return (
    <View style={styles.wrap}>
      <Text style={[text.bodyMedium, styles.label]}>{ar.liturgy.date}</Text>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={ar.liturgy.date}
        style={({ pressed }) => [
          styles.row,
          disabled ? { opacity: 0.6 } : undefined,
          pressed ? { opacity: 0.85 } : undefined,
        ]}
      >
        <Calendar size={20} color={colors.primary} />
        <Text style={[text.body, styles.value]}>
          {formatArabicDateLong(value, numStyle)}
        </Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={fromIsoDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
  },
  label: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  value: {
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
});
