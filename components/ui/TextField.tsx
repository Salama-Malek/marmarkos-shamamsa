import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextField({ label, error, hint, required, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[text.bodyMedium, styles.label]}>
          {label}
          {required ? <Text style={{ color: colors.absent }}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        style={[
          text.body,
          styles.input,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={colors.textSubtle}
        textAlign="right"
      />
      {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}
      {!error && hint ? <Text style={[text.caption, styles.hint]}>{hint}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.absent,
  },
  hint: {
    color: colors.textMuted,
  },
  error: {
    color: colors.absent,
  },
});
