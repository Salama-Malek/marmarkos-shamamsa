import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, radii, spacing, text } from '@/theme';
import { ar } from '@/lib/i18n';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder, autoFocus }: Props) {
  return (
    <View style={styles.wrap}>
      <Search size={18} color={colors.textMuted} />
      <TextInput
        style={[text.body, styles.input]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ar.actions.search}
        placeholderTextColor={colors.textSubtle}
        autoFocus={autoFocus}
        textAlign="right"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityLabel="مسح البحث"
          hitSlop={8}
        >
          <X size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: spacing.xs,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
});
