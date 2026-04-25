import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChips } from '@/components/ui/FilterChips';
import { StatPill } from '@/components/ui/StatPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DeaconCard } from '@/components/deacons/DeaconCard';

import {
  archiveDeacon,
  countDeacons,
  hardDeleteDeacon,
  listDeacons,
  restoreDeacon,
} from '@/db/deacons';
import { useToast } from '@/components/ui/Toast';
import { ar } from '@/lib/i18n';
import { colors, spacing } from '@/theme';
import type { Deacon } from '@/types';

type Filter = 'all' | 'archived';

const FILTER_OPTIONS = [
  { value: 'all' as const, label: ar.filters.all },
  { value: 'archived' as const, label: ar.filters.archived },
];

export default function DeaconsTab() {
  const router = useRouter();
  const toast = useToast();

  const [deacons, setDeacons] = useState<Deacon[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, archived: 0 });
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [actionTarget, setActionTarget] = useState<Deacon | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Deacon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deacon | null>(null);
  const [pendingAction, setPendingAction] = useState(false);

  const reload = useCallback(async () => {
    const [list, c] = await Promise.all([
      listDeacons({
        filter: filter === 'archived' ? 'archived' : 'active',
        search,
      }),
      countDeacons(),
    ]);
    setDeacons(list);
    setCounts(c);
    setLoading(false);
  }, [filter, search]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function handleArchive(d: Deacon) {
    setPendingAction(true);
    try {
      if (d.isActive) {
        await archiveDeacon(d.id);
        toast.show(ar.deacon.archived_, 'success');
      } else {
        await restoreDeacon(d.id);
        toast.show(ar.deacon.restored, 'success');
      }
      await reload();
    } finally {
      setPendingAction(false);
      setArchiveTarget(null);
    }
  }

  async function handleDelete(d: Deacon) {
    setPendingAction(true);
    try {
      await hardDeleteDeacon(d.id);
      toast.show(ar.deacon.deleted, 'success');
      await reload();
    } finally {
      setPendingAction(false);
      setDeleteTarget(null);
    }
  }

  const showFlow = useMemo(() => {
    if (!loading && deacons.length === 0 && !search && filter === 'all') return 'empty-fresh';
    if (!loading && deacons.length === 0) return 'empty-filtered';
    return 'list';
  }, [loading, deacons.length, search, filter]);

  type DeaconCardProps = ComponentProps<typeof DeaconCard>;
  const handleCardPress = useCallback<DeaconCardProps['onPress']>(
    (d) => router.push({ pathname: '/deacon/[id]', params: { id: d.id } }),
    [router],
  );
  const handleCardLongPress = useCallback<NonNullable<DeaconCardProps['onLongPress']>>(
    (d) => setActionTarget(d),
    [],
  );

  const renderDeaconCard = useCallback(
    ({ item }: { item: Deacon }) => (
      <DeaconCard
        deacon={item}
        onPress={handleCardPress}
        onLongPress={handleCardLongPress}
      />
    ),
    [handleCardPress, handleCardLongPress],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={ar.tabs.deacons} subtitle={ar.app.subtitle} />

      <View style={styles.stats}>
        <StatPill label={ar.filters.all} value={counts.active} tone="primary" />
        <StatPill label={ar.deacon.archivedList} value={counts.archived} tone="cancelled" />
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} />
        <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </View>

      {showFlow === 'empty-fresh' ? (
        <EmptyState
          title={ar.empty.deacons}
          subtitle={ar.empty.deaconsCta}
          actionLabel={ar.deacon.add}
          onAction={() => router.push('/deacon/new')}
        />
      ) : showFlow === 'empty-filtered' ? (
        <EmptyState title={filter === 'archived' ? ar.empty.archived : ar.empty.noResults} />
      ) : (
        <FlatList
          data={deacons}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          renderItem={renderDeaconCard}
          ListFooterComponent={<View style={{ height: 96 }} />}
        />
      )}

      <Fab
        label={ar.deacon.add}
        onPress={() => router.push('/deacon/new')}
        icon={<Plus size={20} color={colors.white} />}
      />

      <ActionSheet
        visible={!!actionTarget}
        title={actionTarget?.name}
        onClose={() => setActionTarget(null)}
        items={
          actionTarget
            ? [
                {
                  key: 'edit',
                  label: ar.actions.edit,
                  onPress: () =>
                    router.push({
                      pathname: '/deacon/[id]/edit',
                      params: { id: actionTarget.id },
                    }),
                },
                {
                  key: 'archive',
                  label: actionTarget.isActive ? ar.actions.archive : ar.actions.unarchive,
                  onPress: () => setArchiveTarget(actionTarget),
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
        visible={!!archiveTarget}
        title={ar.deacon.archiveConfirmTitle}
        body={ar.deacon.archiveConfirmBody}
        confirmLabel={archiveTarget?.isActive ? ar.actions.archive : ar.actions.unarchive}
        loading={pendingAction}
        onConfirm={() => archiveTarget && void handleArchive(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title={ar.deacon.deleteConfirmTitle}
        body={ar.deacon.deleteConfirmBody}
        confirmLabel={ar.actions.confirmDelete}
        destructive
        requireTypeWord={ar.actions.confirm}
        loading={pendingAction}
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
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
});
