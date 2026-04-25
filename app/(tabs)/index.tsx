import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FilterChips } from '@/components/ui/FilterChips';
import { StatPill } from '@/components/ui/StatPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { LiturgyCard } from '@/components/liturgies/LiturgyCard';

import {
  countLiturgies,
  deleteLiturgy,
  listLiturgies,
  listLiturgyMonths,
  type LiturgyListItem,
  type LiturgiesFilter,
} from '@/db/liturgies';

import { ar } from '@/lib/i18n';
import { arabicMonthYear } from '@/lib/date';
import { useNumerals } from '@/lib/numeralsContext';
import { colors, spacing } from '@/theme';

const STATUS_OPTIONS = [
  { value: 'all' as const, label: ar.filters.all },
  { value: 'held' as const, label: ar.filters.held },
  { value: 'cancelled' as const, label: ar.filters.cancelled },
];

export default function LiturgiesTab() {
  const router = useRouter();
  const toast = useToast();
  const { style: numStyle } = useNumerals();

  const [liturgies, setLiturgies] = useState<LiturgyListItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, held: 0, cancelled: 0 });
  const [months, setMonths] = useState<string[]>([]);
  const [filter, setFilter] = useState<LiturgiesFilter>('all');
  const [yearMonth, setYearMonth] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [actionTarget, setActionTarget] = useState<LiturgyListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiturgyListItem | null>(null);
  const [pending, setPending] = useState(false);

  const reload = useCallback(async () => {
    const [list, c, m] = await Promise.all([
      listLiturgies({ filter, yearMonth: yearMonth === 'all' ? undefined : yearMonth }),
      countLiturgies(),
      listLiturgyMonths(),
    ]);
    setLiturgies(list);
    setCounts(c);
    setMonths(m);
    setLoading(false);
  }, [filter, yearMonth]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const monthOptions = useMemo(
    () => [
      { value: 'all', label: ar.filters.allMonths },
      ...months.map((m) => ({ value: m, label: arabicMonthYear(m, numStyle) })),
    ],
    [months, numStyle],
  );

  async function handleDelete(l: LiturgyListItem) {
    setPending(true);
    try {
      await deleteLiturgy(l.id);
      toast.show(ar.liturgy.deleted, 'success');
      await reload();
    } finally {
      setPending(false);
      setDeleteTarget(null);
    }
  }

  const showFlow = useMemo(() => {
    if (!loading && liturgies.length === 0 && filter === 'all' && yearMonth === 'all') {
      return 'empty-fresh';
    }
    if (!loading && liturgies.length === 0) return 'empty-filtered';
    return 'list';
  }, [loading, liturgies.length, filter, yearMonth]);

  const handleCardPress = useCallback(
    (l: LiturgyListItem) =>
      router.push({ pathname: '/liturgy/[id]', params: { id: l.id } }),
    [router],
  );
  const handleCardLongPress = useCallback(
    (l: LiturgyListItem) => setActionTarget(l),
    [],
  );

  const renderCard = useCallback(
    ({ item }: { item: LiturgyListItem }) => (
      <LiturgyCard liturgy={item} onPress={handleCardPress} onLongPress={handleCardLongPress} />
    ),
    [handleCardPress, handleCardLongPress],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={ar.app.title} subtitle={ar.app.subtitle} />

      <View style={styles.stats}>
        <StatPill label={ar.filters.all} value={counts.total} tone="primary" />
        <StatPill label={ar.filters.held} value={counts.held} tone="present" />
        <StatPill label={ar.filters.cancelled} value={counts.cancelled} tone="cancelled" />
      </View>

      <View style={styles.controls}>
        <FilterChips options={STATUS_OPTIONS} value={filter} onChange={setFilter} />
        {monthOptions.length > 1 ? (
          <FilterChips options={monthOptions} value={yearMonth} onChange={setYearMonth} />
        ) : null}
      </View>

      {showFlow === 'empty-fresh' ? (
        <EmptyState
          title={ar.empty.liturgies}
          subtitle={ar.empty.liturgiesCta}
          actionLabel={ar.liturgy.new}
          onAction={() => router.push('/liturgy/new')}
        />
      ) : showFlow === 'empty-filtered' ? (
        <EmptyState title={ar.empty.noResults} />
      ) : (
        <FlatList
          data={liturgies}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          renderItem={renderCard}
          ListFooterComponent={<View style={{ height: 96 }} />}
          initialNumToRender={10}
          windowSize={10}
          removeClippedSubviews
        />
      )}

      <Fab
        label={ar.liturgy.new}
        onPress={() => router.push('/liturgy/new')}
        icon={<Plus size={20} color={colors.white} />}
      />

      <ActionSheet
        visible={!!actionTarget}
        title={actionTarget?.title ?? actionTarget?.date}
        onClose={() => setActionTarget(null)}
        items={
          actionTarget
            ? [
                {
                  key: 'open',
                  label: ar.liturgy.detail,
                  onPress: () =>
                    router.push({ pathname: '/liturgy/[id]', params: { id: actionTarget.id } }),
                },
                {
                  key: 'edit',
                  label: ar.actions.edit,
                  onPress: () =>
                    router.push({
                      pathname: '/liturgy/[id]/edit',
                      params: { id: actionTarget.id },
                    }),
                },
                {
                  key: 'delete',
                  label: ar.actions.delete,
                  destructive: true,
                  onPress: () => setDeleteTarget(actionTarget),
                },
              ]
            : []
        }
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title={ar.liturgy.deleteConfirmTitle}
        body={ar.liturgy.deleteConfirmBody}
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
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  controls: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
});
