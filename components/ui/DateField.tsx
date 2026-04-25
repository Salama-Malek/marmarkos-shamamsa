import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, X as XIcon } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { fromIsoDate, toIsoDate, formatArabicDate } from '@/lib/date';
import { useNumerals } from '@/lib/numeralsContext';

interface Props {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  /** Hides the clear button — use for required dates. */
  required?: boolean;
  disabled?: boolean;
  /** Cap the maximum selectable date. Defaults to today (no future birthdays). */
  maximumDate?: Date;
  minimumDate?: Date;
  /** Style applied to the outer wrapper — pass `{ flex: 1 }` to share a row. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Tappable input that opens the native date picker. Display is RTL-aware
 * (text aligns right, calendar icon on the start side, clear button on the
 * end side). Empty value renders the placeholder; tap clears with the X.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  optional,
  required,
  disabled,
  maximumDate,
  minimumDate,
  containerStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const { style: numStyle } = useNumerals();

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !picked) return;
    onChange(toIsoDate(picked));
  }

  const hasValue = value.length > 0;
  const display = hasValue ? formatArabicDate(value, numStyle) : (placeholder ?? '');
  const showClear = hasValue && !required && !disabled;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[text.bodyMedium, styles.label]}>
          {label}
          {required ? <Text style={{ color: colors.absent }}> *</Text> : null}
          {optional ? <Text style={{ color: colors.textSubtle }}>  (اختياري)</Text> : null}
        </Text>
      ) : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.row,
          disabled ? styles.disabled : undefined,
          pressed ? { opacity: 0.85 } : undefined,
        ]}
      >
        {/*
          Date text first → anchors at the start side (right in RTL). Calendar
          icon last → end side (left in RTL). This way the date value sits
          flush against the right edge of the field where the user expects it
          in Arabic, instead of being squeezed between the icon and a clear
          button.
        */}
        <Text
          style={[
            text.body,
            styles.value,
            !hasValue ? styles.placeholder : undefined,
          ]}
          numberOfLines={1}
        >
          {display}
        </Text>
        {showClear ? (
          <Pressable
            hitSlop={10}
            onPress={() => onChange('')}
            accessibilityLabel="مسح التاريخ"
          >
            <XIcon size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
        <Calendar size={20} color={hasValue ? colors.primary : colors.textMuted} />
      </Pressable>
      {hint ? <Text style={[text.caption, styles.hint]}>{hint}</Text> : null}

      {open ? (
        <DateTimePicker
          value={hasValue ? fromIsoDate(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
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
    alignSelf: 'stretch',
    textAlign: 'right',
    writingDirection: 'rtl',
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
  disabled: {
    opacity: 0.6,
  },
  value: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  placeholder: {
    color: colors.textSubtle,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
