import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { listFeasts } from '@/db/feasts';
import { ar } from '@/lib/i18n';
import { colors, radii, spacing, text } from '@/theme';
import type { Feast, Part, PartCategory, PartScope } from '@/types';

export interface PartFormValue {
  arName: string;
  category: PartCategory;
  scope: PartScope;
  feastIds: string[];
}

interface Props {
  initial?: {
    part: Part;
    feastIds: string[];
  };
  /**
   * When set, the scope picker is hidden and the form opens with feast scope
   * locked + this feast pre-selected. Used by the per-feast "add part" flow.
   */
  forceFeastId?: string;
  submitLabel: string;
  onSubmit: (value: PartFormValue) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const CATEGORY_OPTIONS: { value: PartCategory; label: string }[] = [
  { value: 'reading', label: ar.part.categories.reading },
  { value: 'response', label: ar.part.categories.response },
  { value: 'service', label: ar.part.categories.service },
  { value: 'seasonal', label: ar.part.categories.seasonal },
];

const SCOPE_OPTIONS: { value: PartScope; label: string }[] = [
  { value: 'general', label: ar.part.scopeGeneral },
  { value: 'feast', label: ar.part.scopeFeast },
];

export function PartForm({ initial, forceFeastId, submitLabel, onSubmit, onCancel, submitting }: Props) {
  const [arName, setArName] = useState(initial?.part.arName ?? '');
  const [category, setCategory] = useState<PartCategory>(
    initial?.part.category ?? (forceFeastId ? 'seasonal' : 'reading'),
  );
  const [scope, setScope] = useState<PartScope>(
    forceFeastId ? 'feast' : initial?.part.scope ?? 'general',
  );
  const [feastIds, setFeastIds] = useState<string[]>(
    forceFeastId ? [forceFeastId] : initial?.feastIds ?? [],
  );
  const [feasts, setFeasts] = useState<Feast[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  function toggleFeast(id: string) {
    setFeastIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!arName.trim()) {
      setError(ar.validation.nameRequired);
      return;
    }
    if (scope === 'feast' && feastIds.length === 0) {
      setError(ar.feast.title);
      return;
    }
    setError(null);
    await onSubmit({
      arName: arName.trim(),
      category,
      scope,
      feastIds: scope === 'feast' ? feastIds : [],
    });
  }

  const editingScopeLocked = !!initial; // scope can't change after creation

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <TextField
        label={ar.part.name}
        required
        placeholder={ar.part.namePlaceholder}
        value={arName}
        onChangeText={(v) => {
          setArName(v);
          if (error) setError(null);
        }}
        autoFocus
        error={error ?? undefined}
        autoCapitalize="words"
      />

      <View style={styles.field}>
        <Text style={[text.bodyMedium, styles.fieldLabel]}>{ar.part.category}</Text>
        <SegmentedControl value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
      </View>

      {!forceFeastId ? (
        <View style={styles.field}>
          <Text style={[text.bodyMedium, styles.fieldLabel]}>{ar.part.scope}</Text>
          {editingScopeLocked ? (
            <View style={styles.lockedScope}>
              <Text style={[text.body, { color: colors.textMuted }]}>
                {scope === 'general' ? ar.part.scopeGeneral : ar.part.scopeFeast}
              </Text>
            </View>
          ) : (
            <SegmentedControl value={scope} onChange={setScope} options={SCOPE_OPTIONS} />
          )}
        </View>
      ) : null}

      {scope === 'feast' && !forceFeastId ? (
        <View style={styles.field}>
          <Text style={[text.bodyMedium, styles.fieldLabel]}>{ar.part.feastBelongsTo}</Text>
          <View style={styles.feastList}>
            {feasts.map((f) => {
              const checked = feastIds.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleFeast(f.id)}
                  style={({ pressed }) => [
                    styles.feastChip,
                    checked ? styles.feastChipSelected : undefined,
                    pressed ? { opacity: 0.85 } : undefined,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  {checked ? <Check size={14} color={colors.white} /> : null}
                  <Text
                    style={[
                      text.small,
                      {
                        color: checked ? colors.white : colors.text,
                        fontFamily: 'Cairo_500Medium',
                      },
                    ]}
                  >
                    {f.arName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

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
  field: {
    gap: spacing.xxs,
  },
  fieldLabel: {
    color: colors.text,
  },
  lockedScope: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgDeep,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feastList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  feastChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  feastChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
