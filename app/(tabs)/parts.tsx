import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, ChevronLeft } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FilterChips } from '@/components/ui/FilterChips';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { PartRow } from '@/components/parts/PartRow';

import { listAllParts, setPartActive, deletePart } from '@/db/parts';
import { listFeasts, getFeastPartCounts } from '@/db/feasts';
import { ar } from '@/lib/i18n';
import { colors, spacing, text } from '@/theme';
import type { Feast, Part, PartCategory } from '@/types';

type CategoryFilter = 'all' | PartCategory;

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: ar.filters.all },
  { value: 'reading', label: ar.part.categories.reading },
  { value: 'response', label: ar.part.categories.response },
  { value: 'service', label: ar.part.categories.service },
  { value: 'seasonal', label: ar.part.categories.seasonal },
];

type ScopeView = 'general' | 'feasts';

export default function PartsTab() {
  const router = useRouter();
  const toast = useToast();

  const [parts, setParts] = useState<Part[]>([]);
  const [feasts, setFeasts] = useState<Feast[]>([]);
  const [feastPartCounts, setFeastPartCounts] = useState<Map<string, number>>(new Map());
  const [scopeView, setScopeView] = useState<ScopeView>('general');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [actionTarget, setActionTarget] = useState<Part | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);
  const [pending, setPending] = useState(false);

  const reload = useCallback(async () => {
    const [allParts, allFeasts, counts] = await Promise.all([
      listAllParts(),
      listFeasts(),
      getFeastPartCounts(),
    ]);
    setParts(allParts);
    setFeasts(allFeasts);
    setFeastPartCounts(counts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const visibleParts = useMemo(() => {
    return parts.filter((p) => {
      if (scopeView === 'general' && p.scope !== 'general') return false;
      if (scopeView === 'feasts' && p.scope !== 'feast') return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [parts, scopeView, categoryFilter]);

  async function handleToggleActive(part: Part, next: boolean) {
    try {
      await setPartActive(part.id, next);
      await reload();
    } catch (e) {
      toast.show(String(e), 'error');
    }
  }

  async function handleDelete(part: Part) {
    setPending(true);
    try {
      await deletePart(part.id);
      toast.show(ar.part.deleted, 'success');
      await reload();
    } finally {
      setPending(false);
      setDeleteTarget(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={ar.tabs.parts} subtitle={ar.app.subtitle} />

      <View style={styles.scopeRow}>
        <FilterChips
          options={[
            { value: 'general', label: ar.part.scopeGeneral },
            { value: 'feasts', label: ar.feast.title },
          ]}
          value={scopeView}
          onChange={setScopeView}
          scrollable={false}
        />
      </View>

      {scopeView === 'general' ? (
        <>
          <View style={styles.controls}>
            <FilterChips
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </View>

          {visibleParts.length === 0 ? (
            <EmptyState title={ar.empty.parts} />
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {visibleParts.map((p) => (
                <PartRow
                  key={p.id}
                  part={p}
                  onPress={(part) =>
                    router.push({ pathname: '/part/[id]/edit', params: { id: part.id } })
                  }
                  onLongPress={(part) => setActionTarget(part)}
                  onToggleActive={handleToggleActive}
                />
              ))}
              <View style={{ height: 96 }} />
            </ScrollView>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={[text.small, styles.hint]}>{ar.feast.seededHint}</Text>
          {feasts.map((f) => {
            const count = feastPartCounts.get(f.id) ?? 0;
            return (
              <Pressable
                key={f.id}
                onPress={() =>
                  router.push({ pathname: '/feast/[id]', params: { id: f.id } })
                }
                style={({ pressed }) => [
                  styles.feastRow,
                  pressed ? { opacity: 0.92 } : undefined,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.feastBody}>
                  <Text style={[text.bodyMedium, { color: colors.text }]} numberOfLines={1}>
                    {f.arName}
                  </Text>
                  <Text style={[text.caption, { color: colors.textMuted }]}>
                    {count} جزء خاص
                  </Text>
                </View>
                <ChevronLeft size={20} color={colors.textSubtle} />
              </Pressable>
            );
          })}
          <View style={{ height: 96 }} />
        </ScrollView>
      )}

      <Fab
        label={ar.part.add}
        onPress={() => router.push('/part/new')}
        icon={<Plus size={20} color={colors.white} />}
      />

      <ActionSheet
        visible={!!actionTarget}
        title={actionTarget?.arName}
        onClose={() => setActionTarget(null)}
        items={
          actionTarget
            ? [
                {
                  key: 'edit',
                  label: ar.actions.edit,
                  onPress: () =>
                    router.push({
                      pathname: '/part/[id]/edit',
                      params: { id: actionTarget.id },
                    }),
                },
                {
                  key: 'toggle',
                  label: actionTarget.isActive ? ar.actions.deactivate : ar.actions.activate,
                  onPress: () => void handleToggleActive(actionTarget, !actionTarget.isActive),
                },
                // Seeded parts are protected from deletion — the user can
                // deactivate them via the toggle above instead.
                ...(actionTarget.isSeeded
                  ? []
                  : [
                      {
                        key: 'delete',
                        label: ar.actions.delete,
                        destructive: true,
                        onPress: () => setDeleteTarget(actionTarget),
                      },
                    ]),
              ]
            : []
        }
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title={ar.part.deleteConfirmTitle}
        body={ar.part.deleteConfirmBody}
        confirmLabel={ar.actions.confirmDelete}
        destructive
        loading={pending}
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scopeRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  controls: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  hint: {
    color: colors.textMuted,
    paddingHorizontal: spacing.xxs,
  },
  feastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  feastBody: {
    flex: 1,
    gap: 2,
  },
});
