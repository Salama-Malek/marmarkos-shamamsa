import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { DateRow } from './DateRow';
import { CancelToggleRow } from './CancelToggleRow';
import { FeastSelector } from './FeastSelector';

import { listFeasts } from '@/db/feasts';
import { defaultLiturgyTitle, mostRecentSunday, toIsoDate } from '@/lib/date';
import { useNumerals } from '@/lib/numeralsContext';
import { ar } from '@/lib/i18n';
import { colors, spacing, text } from '@/theme';
import type { Feast, Liturgy } from '@/types';

export interface LiturgyFormValue {
  date: string;
  feastId?: string;
  title: string;
  notes: string;
  cancelled: boolean;
  cancellationReason: string;
}

interface Props {
  initial?: Liturgy;
  submitLabel: string;
  onSubmit: (value: LiturgyFormValue) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  duplicateError?: { existingId: string; date: string } | null;
  onClearDuplicateError?: () => void;
}

function buildInitialValue(initial: Liturgy | undefined, numStyle: 'arabic' | 'western'): LiturgyFormValue {
  if (initial) {
    return {
      date: initial.date,
      feastId: initial.feastId,
      title: initial.title ?? '',
      notes: initial.notes ?? '',
      cancelled: initial.status === 'cancelled',
      cancellationReason: initial.cancellationReason ?? '',
    };
  }
  const date = toIsoDate(mostRecentSunday());
  return {
    date,
    feastId: undefined,
    title: defaultLiturgyTitle(date, numStyle),
    notes: '',
    cancelled: false,
    cancellationReason: '',
  };
}

export function LiturgyForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
  duplicateError,
  onClearDuplicateError,
}: Props) {
  const { style: numStyle } = useNumerals();
  const [value, setValue] = useState<LiturgyFormValue>(() => buildInitialValue(initial, numStyle));
  const [titleEdited, setTitleEdited] = useState<boolean>(!!initial?.title);
  const [feasts, setFeasts] = useState<Feast[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await listFeasts();
      if (!cancelled) setFeasts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update(patch: Partial<LiturgyFormValue>) {
    setValue((prev) => ({ ...prev, ...patch }));
    onClearDuplicateError?.();
  }

  function handleDateChange(next: string) {
    const nextTitle = titleEdited ? value.title : defaultLiturgyTitle(next, numStyle);
    update({ date: next, title: nextTitle });
  }

  function handleTitleChange(next: string) {
    setTitleEdited(true);
    update({ title: next });
  }

  function handleSubmit() {
    void onSubmit(value);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <DateRow value={value.date} onChange={handleDateChange} />

      {duplicateError ? (
        <View style={styles.duplicateBox}>
          <Text style={[text.bodyMedium, { color: colors.absent }]}>
            {ar.liturgy.duplicateError}
          </Text>
        </View>
      ) : null}

      <FeastSelector
        feasts={feasts}
        value={value.feastId}
        onChange={(id) => update({ feastId: id })}
      />

      <TextField
        label={ar.liturgy.title}
        placeholder={ar.liturgy.titlePlaceholder}
        value={value.title}
        onChangeText={handleTitleChange}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <CancelToggleRow
        value={value.cancelled}
        onChange={(next) => update({ cancelled: next })}
      />

      {value.cancelled ? (
        <TextField
          label={ar.liturgy.cancellationReason}
          value={value.cancellationReason}
          onChangeText={(v) => update({ cancellationReason: v })}
          multiline
          numberOfLines={3}
          style={styles.notes}
        />
      ) : null}

      <TextField
        label={ar.liturgy.notes}
        placeholder={ar.liturgy.notesPlaceholder}
        hint={ar.common.optional}
        value={value.notes}
        onChangeText={(v) => update({ notes: v })}
        multiline
        numberOfLines={3}
        style={styles.notes}
      />

      <View style={styles.actions}>
        <Button
          label={submitLabel}
          variant="primary"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.action}
        />
        <Button
          label={ar.actions.cancel}
          variant="secondary"
          onPress={onCancel}
          style={styles.action}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  duplicateBox: {
    backgroundColor: colors.absentBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.absent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
